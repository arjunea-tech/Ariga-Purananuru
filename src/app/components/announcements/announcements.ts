import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';

export interface Announcement {
  id: number;
  title: string;
  message: string;
  target_roles: string[];
  created_at: string;
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

  announcementForm: FormGroup;
  isSubmitting = signal<boolean>(false);
  showForm = signal<boolean>(false);

  constructor() {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      message: ['', [Validators.required]],
      target_roles: [[]]
    });
  }

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.loading.set(true);
    this.http.get<Announcement[]>('http://127.0.0.1:8000/api/announcements').subscribe({
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
    this.http.post<Announcement>('http://127.0.0.1:8000/api/announcements', this.announcementForm.value).subscribe({
      next: (newAnnouncement) => {
        this.announcements.update(list => [newAnnouncement, ...list]);
        this.announcementForm.reset({ target_roles: [] });
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
    
    this.http.delete(`http://127.0.0.1:8000/api/announcements/${id}`).subscribe({
      next: () => {
        this.announcements.update(list => list.filter(a => a.id !== id));
      },
      error: () => {
        this.error.set('Failed to delete announcement.');
      }
    });
  }
}
