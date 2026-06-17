import { environment } from '../../../environments/environment';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  is_active?: boolean;
}

interface StudentProgressStats {
  completion_percentage: number;
  completed_chapters: number;
  total_chapters: number;
  passed_attempts: number;
  average_score: number;
  total_courses: number;
  courses_progress: Array<{
    course_name: string;
    total_chapters: number;
    completed_chapters: number;
    percentage: number;
  }>;
}

@Component({
  selector: 'app-student-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-progress.html',
  styleUrls: ['./student-progress.css']
})
export class StudentProgressComponent implements OnInit {
  private http = inject(HttpClient);
  protected authService = inject(AuthService);

  students = signal<User[]>([]);
  searchQuery = signal<string>('');
  loadingStudents = signal<boolean>(true);

  showProgressModal = signal<boolean>(false);
  selectedStudentForProgress: User | null = null;
  selectedStudentProgress = signal<StudentProgressStats | null>(null);
  loadingProgress = signal<boolean>(false);
  feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    let result = this.students();

    if (query) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.username.toLowerCase().includes(query)
      );
    }
    return result;
  });

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loadingStudents.set(true);
    this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe({
      next: (data) => {
        const studentsOnly = data.filter(u => u.role === 'student');
        this.students.set(studentsOnly);
        this.loadingStudents.set(false);
      },
      error: (err) => {
        this.showFeedback('error', 'Failed to load students.');
        this.loadingStudents.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  viewProgress(student: User): void {
    this.selectedStudentForProgress = student;
    this.showProgressModal.set(true);
    this.loadingProgress.set(true);
    this.selectedStudentProgress.set(null);

    this.http.get<StudentProgressStats>(`${environment.apiUrl}/users/${student.id}/progress-stats`).subscribe({
      next: (data) => {
        this.selectedStudentProgress.set(data);
        this.loadingProgress.set(false);
      },
      error: (err) => {
        this.loadingProgress.set(false);
        this.showFeedback('error', 'Failed to load student progress.');
        this.closeProgressModal();
      }
    });
  }

  closeProgressModal(): void {
    this.showProgressModal.set(false);
    this.selectedStudentForProgress = null;
    this.selectedStudentProgress.set(null);
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => this.feedbackMessage.set(null), 5000);
  }
}
