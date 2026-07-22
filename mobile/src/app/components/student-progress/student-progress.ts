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
    const userId = this.authService.getUser()?.id || 1;
    const courseId = 1;
    try {
      const legacyChaptersRaw = localStorage.getItem('completed_chapters');
      const scopedChaptersRaw = localStorage.getItem(`lang_app_completed_chapters_${userId}_${courseId}`);

      const legacyIds: number[] = legacyChaptersRaw ? JSON.parse(legacyChaptersRaw) : [];
      const scopedIds: number[] = scopedChaptersRaw ? JSON.parse(scopedChaptersRaw) : [];

      const allCompletedSet = new Set<number>([...legacyIds, ...scopedIds]);
      const completedChapterIds = Array.from(allCompletedSet);

      const storedLevelsRaw = localStorage.getItem(`lang_app_completed_levels_${userId}_${courseId}`);
      const completedLevelIds: number[] = storedLevelsRaw ? JSON.parse(storedLevelsRaw) : [];

      const storedXp = localStorage.getItem(`lang_app_xp_${userId}`);
      if (storedXp) {
        this.totalXp.set(+storedXp);
      }

      const storedStreak = localStorage.getItem(`lang_app_streak_${userId}`);
      if (storedStreak) {
        this.streakDays.set(+storedStreak);
      }

      // Dynamic calculation per module
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
        {
          id: 'ezhuthu',
          nameTa: 'எழுத்து',
          nameEn: 'Ezhuthu',
          percentage: calcEzhuthu,
          isUnlocked: true,
          color: '#22c55e'
        },
        {
          id: 'asai',
          nameTa: 'அசை',
          nameEn: 'Asai',
          percentage: calcAsai,
          isUnlocked: calcEzhuthu > 0,
          color: '#00B894'
        },
        {
          id: 'seer',
          nameTa: 'சீர்',
          nameEn: 'Seer',
          percentage: calcSeer,
          isUnlocked: calcAsai > 0,
          color: '#3b82f6'
        },
        {
          id: 'thalai',
          nameTa: 'தளை',
          nameEn: 'Thalai',
          percentage: calcThalai,
          isUnlocked: calcSeer > 0,
          color: '#8b5cf6'
        },
        {
          id: 'alagidhal',
          nameTa: 'அளகிடுதல்',
          nameEn: 'Alagidhal',
          percentage: calcAlagidhal,
          isUnlocked: calcThalai > 0,
          color: '#ec4899'
        }
      ];

      this.moduleProgressList.set(updatedModules);

      // Overall Progress: Mathematical average of all 5 modules
      const totalPctSum = updatedModules.reduce((acc, curr) => acc + curr.percentage, 0);
      const overallAvg = Math.round(totalPctSum / updatedModules.length);
      this.overallProgressPercentage.set(overallAvg);

      // Dynamic Questions Answered
      const storedQuestions = localStorage.getItem(`lang_app_questions_answered_${userId}`);
      if (storedQuestions) {
        this.questionsAnswered.set(+storedQuestions);
      } else {
        const dynamicQuestions = (completedChapterIds.length * 16) + 48;
        this.questionsAnswered.set(dynamicQuestions);
      }

      // Dynamic Studied Today Mins
      const storedMins = localStorage.getItem(`lang_app_study_mins_${userId}`);
      if (storedMins) {
        this.studiedTodayMins.set(+storedMins);
      } else {
        const dynamicMins = Math.max(15, (completedChapterIds.length * 12) + 15);
        this.studiedTodayMins.set(dynamicMins);
      }

      // Dynamic Accuracy Percentage
      const storedAccuracy = localStorage.getItem(`lang_app_accuracy_${userId}`);
      if (storedAccuracy) {
        this.accuracyPercentage.set(+storedAccuracy);
      } else {
        const dynamicAccuracy = completedChapterIds.length > 0 ? Math.min(98, 85 + (completedChapterIds.length * 3)) : 92;
        this.accuracyPercentage.set(dynamicAccuracy);
      }

      // Fetch dynamic stats from backend API only if valid token exists
      const token = this.authService.getToken();
      if (token) {
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
        this.http.get<any>(`${environment.apiUrl}/users/${userId}/progress-stats`, { headers }).pipe(
          catchError(() => of(null))
        ).subscribe((data) => {
          if (data && typeof data.completion_percentage === 'number') {
            this.overallProgressPercentage.set(data.completion_percentage);
          }
          if (data && typeof data.passed_attempts === 'number') {
            this.questionsAnswered.set(data.passed_attempts * 15 + 40);
          }
          if (data && typeof data.average_score === 'number') {
            this.accuracyPercentage.set(Math.round(data.average_score));
          }
        });
      }
    } catch (e) {
      console.error('Failed to calculate dynamic progress:', e);
    }
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
