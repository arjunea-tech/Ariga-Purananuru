import { environment } from '../../../environments/environment';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification.service';
import { StudyTimeService } from '../../services/study-time';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  is_active?: boolean;
  tenant?: {
    id: number;
    tenant_name: string;
    tenant_code: string;
  };
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

export interface ModuleProgressItem {
  id: string;
  nameTa: string;
  nameEn: string;
  percentage: number;
  isUnlocked: boolean;
  color: string;
}

export interface BadgeItem {
  id: string;
  title: string;
  icon: string;
  bgClass: string;
  textClass: string;
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
  private notificationService = inject(NotificationService);
  protected studyTimeService = inject(StudyTimeService);

  loadingMyProgress = signal<boolean>(true);

  // Dynamic Progress Signals
  overallProgressPercentage = signal<number>(0);
  studiedTodayMins = signal<number>(0);
  questionsAnswered = signal<number>(0);
  correctAnswers = signal<number>(0);
  wrongAnswers = signal<number>(0);
  accuracyPercentage = signal<number>(0);
  streakDays = signal<number>(0);
  totalXp = signal<number>(0);

  moduleProgressList = signal<ModuleProgressItem[]>([
    { id: 'ezhuthu', nameTa: 'எழுத்து', nameEn: 'Ezhuthu', percentage: 0, isUnlocked: true, color: '#22c55e' },
    { id: 'asai', nameTa: 'அசை', nameEn: 'Asai', percentage: 0, isUnlocked: false, color: '#00B894' },
    { id: 'seer', nameTa: 'சீர்', nameEn: 'Seer', percentage: 0, isUnlocked: false, color: '#3b82f6' },
    { id: 'thalai', nameTa: 'தளை', nameEn: 'Thalai', percentage: 0, isUnlocked: false, color: '#64748b' },
    { id: 'alagidhal', nameTa: 'அளகிடுதல்', nameEn: 'Alagidhal', percentage: 0, isUnlocked: false, color: '#64748b' }
  ]);

  earnedBadgesList = signal<BadgeItem[]>([]);

  students = signal<User[]>([]);
  searchQuery = signal<string>('');
  loadingStudents = signal<boolean>(true);
  selectedTenantId = signal<string>('all');
  tenantsList = signal<any[]>([]);

  showProgressModal = signal<boolean>(false);
  selectedStudentForProgress: User | null = null;
  selectedStudentProgress = signal<StudentProgressStats | null>(null);
  loadingProgress = signal<boolean>(false);

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
    const role = this.authService.getUserRole();
    if (role === 'super_admin') {
      this.loadTenants();
    }
    this.loadProgressData();
    this.loadStudents();
  }

  loadTenants(): void {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    
    this.http.get<any[]>(`${environment.apiUrl}/tenants`, { headers }).subscribe({
      next: (tenants) => {
        this.tenantsList.set(tenants || []);
      },
      error: (err) => {
        console.error('Failed to load tenants in student progress', err);
      }
    });
  }

  loadProgressData(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.loadingMyProgress.set(false);
      return;
    }

    this.loadingMyProgress.set(true);
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any>(`${environment.apiUrl}/student/dashboard`, { headers }).pipe(
      catchError((e) => {
        console.error('Failed to load dynamic progress:', e);
        this.loadingMyProgress.set(false);
        return of(null);
      })
    ).subscribe((data) => {
      this.loadingMyProgress.set(false);
      if (!data) return;

      if (typeof data.completion_percentage === 'number') {
        this.overallProgressPercentage.set(data.completion_percentage);
      }
      
      if (typeof data.xp_points === 'number') {
        this.totalXp.set(data.xp_points);
      }
      
      if (typeof data.streak_days === 'number') {
        this.streakDays.set(data.streak_days);
      }
      
      if (typeof data.questions_answered === 'number') {
        this.questionsAnswered.set(data.questions_answered);
      } else if (typeof data.total_attempts === 'number') {
        this.questionsAnswered.set(data.total_attempts > 0 ? data.total_attempts * 5 : 0);
      } else if (typeof data.passed_attempts === 'number') {
        this.questionsAnswered.set(data.passed_attempts > 0 ? data.passed_attempts * 5 : 0);
      }

      if (typeof data.correct_answers === 'number') {
        this.correctAnswers.set(data.correct_answers);
      }

      if (typeof data.wrong_answers === 'number') {
        this.wrongAnswers.set(data.wrong_answers);
      }

      if (typeof data.accuracy_percentage === 'number') {
        this.accuracyPercentage.set(Math.round(data.accuracy_percentage));
      } else if (typeof data.average_score === 'number') {
        this.accuracyPercentage.set(Math.round(data.average_score));
      }

      // 100% Dynamic module progress from backend DB levels
      if (data.module_progressions && Array.isArray(data.module_progressions) && data.module_progressions.length > 0) {
        const dynamicModules: ModuleProgressItem[] = data.module_progressions.map((m: any) => {
          let nameEn = m.code || '';
          // Hide raw database codes (e.g. YAP-L1-1784355643) from user view
          if (nameEn.startsWith('YAP-') || /^[A-Z0-9_-]+$/i.test(nameEn) || nameEn === m.name) {
            nameEn = '';
          }
          return {
            id: m.id,
            nameTa: m.name,
            nameEn: nameEn,
            percentage: m.percentage,
            isUnlocked: m.is_unlocked,
            color: m.color
          };
        });
        this.moduleProgressList.set(dynamicModules);
      } else {
        const completedChapterIds: number[] = data.completed_chapter_ids || [];
        const getModuleProgress = (chapterIds: number[]) => {
          const completedCount = completedChapterIds.filter(id => chapterIds.includes(id)).length;
          if (completedCount >= chapterIds.length) return 100;
          if (completedCount > 0) return Math.round((completedCount / chapterIds.length) * 100);
          return 0;
        };

        const ezhuthuPct = getModuleProgress([1, 2, 1001]);
        const asaiPct = getModuleProgress([3, 4, 1002]);
        const seerPct = getModuleProgress([5, 6, 1003]);
        const thalaiPct = getModuleProgress([7, 8, 1004]);
        const alagidhalPct = getModuleProgress([9, 10, 1005]);

        const updatedModules: ModuleProgressItem[] = [
          { id: 'ezhuthu', nameTa: 'எழுத்து', nameEn: 'Ezhuthu', percentage: ezhuthuPct, isUnlocked: true, color: '#22c55e' },
          { id: 'asai', nameTa: 'அசை', nameEn: 'Asai', percentage: asaiPct, isUnlocked: ezhuthuPct > 0, color: '#00B894' },
          { id: 'seer', nameTa: 'சீர்', nameEn: 'Seer', percentage: seerPct, isUnlocked: asaiPct > 0, color: '#3b82f6' },
          { id: 'thalai', nameTa: 'தளை', nameEn: 'Thalai', percentage: thalaiPct, isUnlocked: seerPct > 0, color: '#8b5cf6' },
          { id: 'alagidhal', nameTa: 'அளகிடுதல்', nameEn: 'Alagidhal', percentage: alagidhalPct, isUnlocked: thalaiPct > 0, color: '#ec4899' }
        ];
        this.moduleProgressList.set(updatedModules);
      }

      // Studied today mins dynamically using active app StudyTimeService + weekly activity log
      const trackedMins = this.studyTimeService.getTodayStudyMinutes();
      const todayDayOfWeek = (new Date().getDay() || 7) - 1; // 0 for Mon, 6 for Sun
      const activitiesToday = data.weekly_activity && data.weekly_activity[todayDayOfWeek] ? data.weekly_activity[todayDayOfWeek] : 0;
      const activityMins = activitiesToday * 5;
      const totalMinsToday = Math.max(trackedMins, activityMins);
      this.studiedTodayMins.set(totalMinsToday);

      // Map dynamic badges
      if (data.badges && Array.isArray(data.badges)) {
        const earnedBadges = data.badges.filter((b: any) => b.unlocked).map((b: any, index: number) => {
          const colors = ['primary', 'purple', 'warning', 'success', 'danger', 'info'];
          const c = colors[index % colors.length];
          
          let biIcon = 'bi-award-fill';
          if (b.id === 'first_step') biIcon = 'bi-rocket-takeoff-fill';
          else if (b.id === 'bookworm') biIcon = 'bi-book-half';
          else if (b.id === 'scholar') biIcon = 'bi-mortarboard-fill';
          else if (b.id === 'chapter_champ') biIcon = 'bi-trophy-fill';
          
          return {
            id: b.id,
            title: b.title,
            icon: biIcon,
            bgClass: `bg-${c}-subtle`,
            textClass: `text-${c}`
          };
        });
        this.earnedBadgesList.set(earnedBadges);
      }
    });
  }

  loadStudents(): void {
    const token = this.authService.getToken();
    if (!token || !this.authService.hasRole(['super_admin', 'admin', 'staff'])) {
      this.loadingStudents.set(false);
      return;
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.loadingStudents.set(true);

    let url = `${environment.apiUrl}/users`;
    const selectedTenant = this.selectedTenantId();
    if (this.authService.getUserRole() === 'super_admin' && selectedTenant !== 'all') {
      url += `?tenant_id=${selectedTenant}`;
    }

    this.http.get<User[]>(url, { headers }).pipe(
      catchError(() => of([]))
    ).subscribe((data) => {
      const studentsOnly = (data || []).filter(u => u.role === 'student');
      this.students.set(studentsOnly);
      this.loadingStudents.set(false);
    });
  }

  onTenantChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedTenantId.set(select.value);
    this.loadStudents();
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

    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;

    this.http.get<StudentProgressStats>(`${environment.apiUrl}/users/${student.id}/progress-stats`, { headers }).pipe(
      catchError(() => of(null))
    ).subscribe((data) => {
      if (data) {
        this.selectedStudentProgress.set(data);
      }
      this.loadingProgress.set(false);
    });
  }

  closeProgressModal(): void {
    this.showProgressModal.set(false);
    this.selectedStudentForProgress = null;
    this.selectedStudentProgress.set(null);
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.notificationService.show(type, text);
  }
}
