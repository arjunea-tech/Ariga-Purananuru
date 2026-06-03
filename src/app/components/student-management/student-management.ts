import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';

interface Student {
  id: number;
  name: string;
  username: string;
  is_active?: boolean;
}

interface ImportedStudent {
  id: number;
  name: string;
  username: string;
  password?: string;
}

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-management.html',
  styleUrls: ['./student-management.css'],
})
export class StudentManagement implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  students = signal<Student[]>([]);
  searchQuery = signal<string>('');
  importing = false;
  feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  protected authService = inject(AuthService);
  private fb = inject(FormBuilder);

  showAddUserModal = false;
  addUserForm!: FormGroup;
  submitting = false;

  // Roles available for creation based on active user's role
  availableRoles = computed(() => {
    const currentRole = this.authService.getUserRole();
    if (currentRole === 'super_admin') {
      return [
        { value: 'tenant_admin', label: 'Tenant Admin' },
        { value: 'property_manager', label: 'Property Manager' },
        { value: 'student', label: 'Student' }
      ];
    } else if (currentRole === 'tenant_admin') {
      return [
        { value: 'property_manager', label: 'Property Manager (Coordinator)' },
        { value: 'student', label: 'Student' }
      ];
    } else {
      return [
        { value: 'student', label: 'Student' }
      ];
    }
  });

  // Modal data for showing imported student credentials
  importedResults = signal<ImportedStudent[]>([]);
  importErrors = signal<string[]>([]);
  showResultsModal = false;

  // Filtered student list
  filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.students();
    return this.students().filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.username.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.http.get<Student[]>('http://localhost:8000/api/users/students').subscribe({
      next: (data) => this.students.set(data),
      error: (err) => this.showFeedback('error', 'Failed to load students list.'),
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    this.importing = true;
    this.feedbackMessage.set(null);
    this.importedResults.set([]);
    this.importErrors.set([]);

    this.http.post<any>('http://localhost:8000/api/users/import', formData).subscribe({
      next: (res) => {
        this.importing = false;
        this.students.set([...this.students(), ...res.imported]);
        this.importedResults.set(res.imported);
        this.importErrors.set(res.errors || []);
        this.showResultsModal = true;
        this.showFeedback('success', `Import completed. ${res.imported.length} students added.`);
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
    a.download = 'student_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  initAddUserForm(): void {
    const defaultRole = this.availableRoles()[0]?.value || 'student';
    const defaultTenant = this.authService.getTenantCode() || '';

    this.addUserForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      login: ['', [Validators.required, Validators.minLength(3)]],
      role: [defaultRole, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]],
      tenant_code: [defaultTenant, [Validators.required]]
    }, { validators: this.passwordMatchValidator });
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
    const formValue = this.addUserForm.value;

    this.http.post<any>('http://localhost:8000/api/register', formValue).subscribe({
      next: (res) => {
        this.submitting = false;
        this.closeAddUserModal();
        this.showFeedback('success', `User Account for "${res.user.name}" created successfully!`);
        // If the created user was a student, reload the list
        if (res.user.role === 'student') {
          this.loadStudents();
        }
      },
      error: (err) => {
        this.submitting = false;
        this.showFeedback('error', err.error?.message || err.error?.login?.[0] || 'Failed to create user account.');
      }
    });
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => this.feedbackMessage.set(null), 5000);
  }
}
