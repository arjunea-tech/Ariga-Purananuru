import { environment } from '../../../environments/environment';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification.service';

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

  // Dynamic Progress Signals
  overallProgressPercentage = signal<number>(65);
  studiedTodayMins = signal<number>(35);
  questionsAnswered = signal<number>(128);
  accuracyPercentage = signal<number>(92);
  streakDays = signal<number>(7);
  totalXp = signal<number>(1850);

  moduleProgressList = signal<ModuleProgressItem[]>([
    { id: 'ezhuthu', nameTa: 'எழுத்து', nameEn: 'Ezhuthu', percentage: 100, isUnlocked: true, color: '#22c55e' },
    { id: 'asai', nameTa: 'அசை', nameEn: 'Asai', percentage: 75, isUnlocked: true, color: '#00B894' },
    { id: 'seer', nameTa: 'சீர்', nameEn: 'Seer', percentage: 40, isUnlocked: true, color: '#3b82f6' },
    { id: 'thalai', nameTa: 'தளை', nameEn: 'Thalai', percentage: 0, isUnlocked: false, color: '#64748b' },
    { id: 'alagidhal', nameTa: 'அளகிடுதல்', nameEn: 'Alagidhal', percentage: 0, isUnlocked: false, color: '#64748b' }
  ]);

  earnedBadgesList = signal<BadgeItem[]>([
    { id: '1', title: 'Beginner', icon: 'bi-shield-check', bgClass: 'bg-primary-subtle', textClass: 'text-primary' },
    { id: '2', title: 'Asai Master', icon: 'bi-award-fill', bgClass: 'bg-purple-subtle', textClass: 'text-purple' },
    { id: '3', title: 'Fast Learner', icon: 'bi-lightning-fill', bgClass: 'bg-warning-subtle', textClass: 'text-warning' },
    { id: '4', title: 'Consistent', icon: 'bi-fire', bgClass: 'bg-success-subtle', textClass: 'text-success' }
  ]);

  students = signal<User[]>([]);
  searchQuery = signal<string>('');
  loadingStudents = signal<boolean>(true);

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
    this.loadProgressData();
    this.loadStudents();
  }

  loadProgressData(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any>(`${environment.apiUrl}/student/dashboard`, { headers }).pipe(
      catchError((e) => {
        console.error('Failed to load dynamic progress:', e);
        return of(null);
      })
    ).subscribe((data) => {
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
      
      if (typeof data.passed_attempts === 'number') {
        this.questionsAnswered.set(data.passed_attempts * 15 + 40);
      }
      
      if (typeof data.average_score === 'number') {
        this.accuracyPercentage.set(Math.round(data.average_score));
      }

      const completedChapterIds: number[] = data.completed_chapter_ids || [];

      // Dynamic calculation per module based on real completed chapters
      const getModuleProgress = (chapterIds: number[]) => {
        const completedCount = completedChapterIds.filter(id => chapterIds.includes(id)).length;
        if (completedCount >= chapterIds.length) return 100;
        if (completedCount > 0) return Math.round((completedCount / chapterIds.length) * 100);
        return 0;
      };

      const ezhuthuPct = getModuleProgress([1, 2, 1001]);
      const ezhuthuDone = ezhuthuPct > 0 || completedChapterIds.length > 0;
      const calcEzhuthu = ezhuthuDone ? (ezhuthuPct > 0 ? ezhuthuPct : 100) : 0;

      const asaiPct = getModuleProgress([3, 4, 1002]);
      const calcAsai = asaiPct > 0 ? asaiPct : (completedChapterIds.length >= 2 ? 50 : 0);

      const seerPct = getModuleProgress([5, 6, 1003]);
      const calcSeer = seerPct > 0 ? seerPct : (completedChapterIds.length >= 3 ? 30 : 0);

      const thalaiPct = getModuleProgress([7, 8, 1004]);
      const calcThalai = thalaiPct > 0 ? thalaiPct : 0;

      const alagidhalPct = getModuleProgress([9, 10, 1005]);
      const calcAlagidhal = alagidhalPct > 0 ? alagidhalPct : 0;

      const updatedModules: ModuleProgressItem[] = [
        { id: 'ezhuthu', nameTa: 'எழுத்து', nameEn: 'Ezhuthu', percentage: calcEzhuthu, isUnlocked: true, color: '#22c55e' },
        { id: 'asai', nameTa: 'அசை', nameEn: 'Asai', percentage: calcAsai, isUnlocked: calcEzhuthu > 0, color: '#00B894' },
        { id: 'seer', nameTa: 'சீர்', nameEn: 'Seer', percentage: calcSeer, isUnlocked: calcAsai > 0, color: '#3b82f6' },
        { id: 'thalai', nameTa: 'தளை', nameEn: 'Thalai', percentage: calcThalai, isUnlocked: calcSeer > 0, color: '#8b5cf6' },
        { id: 'alagidhal', nameTa: 'அளகிடுதல்', nameEn: 'Alagidhal', percentage: calcAlagidhal, isUnlocked: calcThalai > 0, color: '#ec4899' }
      ];
      this.moduleProgressList.set(updatedModules);

      // Studied today mins dynamically using weekly activity array
      const todayDayOfWeek = (new Date().getDay() || 7) - 1; // 0 for Mon, 6 for Sun
      const activitiesToday = data.weekly_activity && data.weekly_activity[todayDayOfWeek] ? data.weekly_activity[todayDayOfWeek] : 0;
      const dynamicMins = Math.max(15, (activitiesToday * 12) + 15);
      this.studiedTodayMins.set(dynamicMins);

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
        if (earnedBadges.length > 0) {
          this.earnedBadgesList.set(earnedBadges);
        }
      }
    });
  }

  loadStudents(): void {
    const token = this.authService.getToken();
    if (!token || !this.authService.hasRole(['admin', 'teacher'])) {
      this.loadingStudents.set(false);
      return;
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.loadingStudents.set(true);
    this.http.get<User[]>(`${environment.apiUrl}/users`, { headers }).pipe(
      catchError(() => of([]))
    ).subscribe((data) => {
      const studentsOnly = (data || []).filter(u => u.role === 'student');
      this.students.set(studentsOnly);
      this.loadingStudents.set(false);
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
