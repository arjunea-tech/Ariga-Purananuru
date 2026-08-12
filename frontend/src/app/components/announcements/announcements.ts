import { Component, OnInit, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';

export interface Announcement {
  id: number;
  title: string;
  message: string;
  target_roles: string[];
  tenant_id?: any;
  created_at: string;
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
  tenants = signal<any[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  announcementForm: FormGroup;
  isSubmitting = signal<boolean>(false);
  showForm = signal<boolean>(false);

  constructor() {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      message: ['', [Validators.required]],
      target_roles: [[]],
      tenant_id: ['global']
    });
  }

  ngOnInit(): void {
    this.loadAnnouncements();
    if (this.authService.hasRole(['super_admin'])) {
      this.loadTenants();
    }
  }

  loadTenants(): void {
    this.http.get<any[]>(`${environment.apiUrl}/tenants`).subscribe({
      next: (data) => {
        this.tenants.set(data);
      },
      error: () => {
        console.error('Failed to load tenants');
      }
    });
  }

  loadAnnouncements(): void {
    this.loading.set(true);
    this.http.get<Announcement[]>(`${environment.apiUrl}/announcements`).subscribe({
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

  submitAnnouncement(): void {
    if (this.announcementForm.invalid) return;

    this.isSubmitting.set(true);
    this.http.post<Announcement>(`${environment.apiUrl}/announcements`, this.announcementForm.value).subscribe({
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

  deleteAnnouncement(id: number): void {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    this.http.delete(`${environment.apiUrl}/announcements/${id}`).subscribe({
      next: () => {
        this.announcements.update(list => list.filter(a => a.id !== id));
      },
      error: () => {
        this.error.set('Failed to delete announcement.');
      }
    });
  }
}
