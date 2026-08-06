import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

export interface Announcement {
  id: number;
  title: string;
  message: string;
  target_roles: string[];
  created_at: string;
  tenant_id: number | null;
  tenant?: {
    tenant_name: string;
  };
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './announcements.html',
  styleUrls: ['./announcements.css']
})
export class Announcements implements OnInit {
  private http = inject(HttpClient);
  protected authService = inject(AuthService);
  private fb = inject(FormBuilder);

  announcements = signal<Announcement[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  selectedTenantId = signal<string>('all');
  tenantsList = signal<any[]>([]);

  announcementForm: FormGroup;
  isSubmitting = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingAnnouncement = signal<Announcement | null>(null);

  constructor() {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      message: ['', [Validators.required]],
      target_roles: [[]],
      tenant_id: ['global']
    });
  }

  ngOnInit(): void {
    const role = this.authService.getUserRole();
    if (role === 'super_admin') {
      this.loadTenants();
    }
    this.loadAnnouncements();
  }

  loadTenants(): void {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    
    this.http.get<any[]>(`${environment.apiUrl}/tenants`, { headers }).subscribe({
      next: (tenants) => {
        this.tenantsList.set(tenants || []);
      },
      error: (err) => {
        console.error('Failed to load tenants in announcements', err);
      }
    });
  }

  loadAnnouncements(): void {
    this.loading.set(true);
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;

    let url = `${environment.apiUrl}/announcements`;
    const selectedTenant = this.selectedTenantId();
    if (this.authService.getUserRole() === 'super_admin' && selectedTenant) {
      url += `?tenant_id=${selectedTenant}`;
    }

    this.http.get<Announcement[]>(url, { headers }).subscribe({
      next: (data) => {
        this.announcements.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load announcements.');
        this.loading.set(false);
      }
    });
  }

  onTenantChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedTenantId.set(select.value);
    this.loadAnnouncements();
  }

  submitAnnouncement(): void {
    if (this.announcementForm.invalid) return;

    this.isSubmitting.set(true);
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;

    const payload = { ...this.announcementForm.value };
    if (payload.tenant_id === 'global') {
      payload.tenant_id = null;
    } else if (payload.tenant_id) {
      payload.tenant_id = Number(payload.tenant_id);
    }

    const editMode = this.editingAnnouncement();
    if (editMode) {
      this.http.put<Announcement>(`${environment.apiUrl}/announcements/${editMode.id}`, payload, { headers }).subscribe({
        next: (updatedAnn) => {
          this.announcements.update(list => list.map(a => a.id === editMode.id ? { ...a, ...updatedAnn } : a));
          this.announcementForm.reset({ target_roles: [], tenant_id: 'global' });
          this.editingAnnouncement.set(null);
          this.showForm.set(false);
          this.isSubmitting.set(false);
        },
        error: () => {
          this.error.set('Failed to update announcement.');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.http.post<Announcement>(`${environment.apiUrl}/announcements`, payload, { headers }).subscribe({
        next: (newAnnouncement) => {
          this.announcements.update(list => [newAnnouncement, ...list]);
          this.announcementForm.reset({ target_roles: [], tenant_id: 'global' });
          this.showForm.set(false);
          this.isSubmitting.set(false);
        },
        error: () => {
          this.error.set('Failed to publish announcement.');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  editAnnouncement(announcement: Announcement): void {
    this.editingAnnouncement.set(announcement);
    this.announcementForm.patchValue({
      title: announcement.title,
      message: announcement.message,
      target_roles: announcement.target_roles || [],
      tenant_id: announcement.tenant_id === null ? 'global' : announcement.tenant_id.toString()
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.announcementForm.reset({ target_roles: [], tenant_id: 'global' });
    this.editingAnnouncement.set(null);
    this.showForm.set(false);
  }

  deleteAnnouncement(id: number): void {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;

    this.http.delete(`${environment.apiUrl}/announcements/${id}`, { headers }).subscribe({
      next: () => {
        this.announcements.update(list => list.filter(a => a.id !== id));
      },
      error: () => {
        this.error.set('Failed to delete announcement.');
      }
    });
  }
}
