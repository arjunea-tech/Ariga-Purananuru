import { environment } from '../../../environments/environment';
import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { TenantService, TenantData } from '../../services/tenant';
import { NotificationService } from '../../services/notification.service';

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  is_active?: boolean;
  tenant_id?: number;
  dob?: string | null;
  tenant?: {
    id: number;
    tenant_name: string;
  };
}

interface ImportedUser {
  id: number;
  name: string;
  username: string;
  password?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css'],
})
export class UserManagement implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  users = signal<User[]>([]);
  tenants = signal<TenantData[]>([]);
  searchQuery = signal<string>('');
  selectedRoleFilter = signal<string>('all');
  selectedTenantFilter = signal<string>('all');
  importing = false;

  protected authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  showAddUserModal = false;
  addUserForm!: FormGroup;
  submitting = false;

  showEditUserModal = false;
  editUserForm!: FormGroup;
  selectedUserForEdit: User | null = null;
  deletingUserId: number | null = null;

  // Roles available for creation based on active user's role
  availableRoles = computed(() => {
    const currentRole = this.authService.getUserRole();
    if (currentRole === 'super_admin') {
      return [
        { value: 'admin', label: 'Admin' },
        { value: 'staff', label: 'Staff' },
        { value: 'student', label: 'Student' }
      ];
    } else if (currentRole === 'admin') {
      return [
        { value: 'staff', label: 'Staff' },
        { value: 'student', label: 'Student' }
      ];
    } else {
      return [
        { value: 'student', label: 'Student' }
      ];
    }
  });

  // Modal data for showing imported user credentials
  importedResults = signal<ImportedUser[]>([]);
  importErrors = signal<string[]>([]);
  showResultsModal = false;

  // Filtered user list
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const roleFilter = this.selectedRoleFilter();
    const tenantFilter = this.selectedTenantFilter();
    let result = this.users();

    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    
    if (tenantFilter !== 'all') {
      result = result.filter(u => u.tenant_id === parseInt(tenantFilter, 10));
    }

    if (query) {
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query)
      );
    }
    
    return result;
  });

  ngOnInit(): void {
    this.loadUsers();
    if (this.authService.getUserRole() === 'super_admin') {
      this.loadTenants();
    }
  }

  loadUsers(): void {
    this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe({
      next: (data) => this.users.set(data),
      error: (err) => this.showFeedback('error', 'Failed to load users list.'),
    });
  }

  loadTenants(): void {
    this.tenantService.getAll().subscribe({
      next: (data) => this.tenants.set(data),
      error: (err) => console.error('Failed to load tenants', err)
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onRoleFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedRoleFilter.set(select.value);
  }
  
  onTenantFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedTenantFilter.set(select.value);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const currentRole = this.authService.getUserRole();
    const selectedTenantId = this.selectedTenantFilter();

    if (currentRole === 'super_admin' && selectedTenantId === 'all') {
      this.showFeedback('error', 'Please select a specific Tenant (School) filter first before importing users.');
      input.value = '';
      return;
    }

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    if (currentRole === 'super_admin') {
      const selectedTenant = this.tenants().find(t => t.id === parseInt(selectedTenantId, 10));
      if (selectedTenant) {
        formData.append('tenant_code', selectedTenant.tenant_code);
      }
    }

    this.importing = true;
    this.importedResults.set([]);
    this.importErrors.set([]);

    this.http.post<any>(`${environment.apiUrl}/users/import`, formData).subscribe({
      next: (res) => {
        this.importing = false;
        this.users.set([...this.users(), ...res.imported]);
        this.importedResults.set(res.imported);
        this.importErrors.set(res.errors || []);
        this.showResultsModal = true;
        this.showFeedback('success', `Import completed. ${res.imported.length} users added.`);
        // Reset file input
        input.value = '';
      },
      error: (err) => {
        this.importing = false;
        this.showFeedback('error', err.error?.error || err.error?.message || 'Failed to import CSV file.');
        input.value = '';
      },
    });
  }

  closeResultsModal(): void {
    this.showResultsModal = false;
    this.importedResults.set([]);
    this.importErrors.set([]);
  }

  downloadTemplate(): void {
    const headers = 'name,username,password\nJohn Doe,johndoe_std_001,pass123\nJane Smith,,\n';
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  initAddUserForm(): void {
    const defaultRole = this.availableRoles()[0]?.value || 'student';
    const isSuperAdmin = this.authService.getUserRole() === 'super_admin';

    this.addUserForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      login: ['', [Validators.required, Validators.minLength(3)]],
      role: [defaultRole, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]],
      dob: [null],
      tenant_code: [isSuperAdmin ? '' : null, isSuperAdmin ? [Validators.required] : []]
    }, { validators: this.passwordMatchValidator });

    // Handle dynamic validation for name field based on role selection
    this.addUserForm.get('role')?.valueChanges.subscribe((role) => {
      const nameControl = this.addUserForm.get('name');
      if (role === 'staff') {
        nameControl?.clearValidators();
      } else {
        nameControl?.setValidators([Validators.required, Validators.minLength(3)]);
      }
      nameControl?.updateValueAndValidity();
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('password_confirmation')?.value
      ? null : { mismatch: true };
  }

  openAddUserModal(): void {
    this.initAddUserForm();
    this.showAddUserModal = true;
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    if (this.addUserForm) {
      this.addUserForm.reset();
    }
  }

  onSubmitUser(): void {
    if (this.addUserForm.invalid) {
      this.addUserForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = { ...this.addUserForm.value };

    // For staff (coordinators), set name to be username if not provided
    if (formValue.role === 'staff' && !formValue.name) {
      formValue.name = `Manager (${formValue.login})`;
    }

    this.http.post<any>(`${environment.apiUrl}/register`, formValue).subscribe({
      next: (res) => {
        this.submitting = false;
        this.closeAddUserModal();
        this.showFeedback('success', `User Account for "${res.user.name}" created successfully!`);
        this.loadUsers();
      },
      error: (err) => {
        this.submitting = false;
        this.showFeedback('error', err.error?.message || err.error?.login?.[0] || 'Failed to create user account.');
      }
    });
  }

  initEditUserForm(user: User): void {
    this.selectedUserForEdit = user;
    this.editUserForm = this.fb.group({
      name: [user.name, [Validators.required, Validators.minLength(3)]],
      username: [user.username, [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.minLength(6)]], // optional for edit
      dob: [user.dob || null]
    });
  }

  openEditUserModal(user: User): void {
    this.initEditUserForm(user);
    this.showEditUserModal = true;
  }

  closeEditUserModal(): void {
    this.showEditUserModal = false;
    this.selectedUserForEdit = null;
    if (this.editUserForm) {
      this.editUserForm.reset();
    }
  }

  onSubmitEditUser(): void {
    if (this.editUserForm.invalid || !this.selectedUserForEdit) {
      this.editUserForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = { ...this.editUserForm.value };
    
    // Remove password if it's empty so we don't overwrite with blank
    if (!formValue.password) {
      delete formValue.password;
    }

    this.http.put<any>(`${environment.apiUrl}/users/${this.selectedUserForEdit.id}`, formValue).subscribe({
      next: (res) => {
        this.submitting = false;
        this.closeEditUserModal();
        this.showFeedback('success', `User account updated successfully!`);
        this.loadUsers();
      },
      error: (err) => {
        this.submitting = false;
        this.showFeedback('error', err.error?.message || 'Failed to update user account.');
      }
    });
  }

  deleteUser(userId: number): void {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    this.deletingUserId = userId;
    this.http.delete<any>(`${environment.apiUrl}/users/${userId}`).subscribe({
      next: () => {
        this.deletingUserId = null;
        this.showFeedback('success', 'User deleted successfully.');
        this.loadUsers();
      },
      error: (err) => {
        this.deletingUserId = null;
        this.showFeedback('error', err.error?.message || 'Failed to delete user.');
      }
    });
  }

  calculateAge(dob: string | null | undefined): string {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} yrs` : '-';
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.notificationService.show(type, text);
  }
}
