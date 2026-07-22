import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

export interface DynamicModuleItem {
  id: string;
  nameTa: string;
  nameEn: string;
  totalChapters: number;
  completedChapters: number;
  progress: number;
  status: 'completed' | 'in-progress' | 'locked';
  color: string;
}

@Component({
  selector: 'app-kids-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kids-dashboard.html',
  styleUrls: ['./kids-dashboard.css']
})
export class KidsDashboard implements OnInit {
  @Input() structure: any = null;
  @Input() currentView: string = 'levels';
  @Input() activeLevelId: any = null;
  @Input() activeChapterId: any = null;
  @Input() completedLevels: any[] = [];
  @Input() completedChapters: any[] = [];

  @Output() selectLevel = new EventEmitter<number>();
  @Output() selectChapterNode = new EventEmitter<number>();

  protected authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  userName = signal<string>('Student');
  streakDays = signal<number>(1);
  xpPoints = signal<number>(150);
  completedCount = signal<number>(0);
  totalCount = signal<number>(15);
  overallProgress = signal<number>(0);

  activeCourse = signal({
    title: 'அழகுத் தமிழ் யாப்பிலக்கணம்',
    chapterName: 'பாடம் 1: எழுத்து இலக்கணம்',
    progress: 0,
    chapterId: 1
  });

  dynamicModules = signal<DynamicModuleItem[]>([]);

  ngOnInit(): void {
    this.loadUserData();
    this.fetchDashboardData();
  }

  loadUserData(): void {
    const user = this.authService.getUser();
    if (user && user.name) {
      this.userName.set(user.name);
    }
    const userId = user?.id || 1;

    // Load streak & XP dynamically from storage
    const storedStreak = localStorage.getItem(`lang_app_streak_${userId}`);
    if (storedStreak) this.streakDays.set(+storedStreak);

    const storedXp = localStorage.getItem(`lang_app_xp_${userId}`);
    if (storedXp) this.xpPoints.set(+storedXp);

    // Calculate completed chapter IDs
    const legacyChaptersRaw = localStorage.getItem('completed_chapters');
    const scopedChaptersRaw = localStorage.getItem(`lang_app_completed_chapters_${userId}_1`);
    const legacyIds: number[] = legacyChaptersRaw ? JSON.parse(legacyChaptersRaw) : [];
    const scopedIds: number[] = scopedChaptersRaw ? JSON.parse(scopedChaptersRaw) : [];
    const allCompleted = Array.from(new Set([...legacyIds, ...scopedIds]));

    const doneCount = allCompleted.length;
    this.completedCount.set(doneCount);
    const percent = Math.min(Math.round((doneCount / 15) * 100), 100);
    this.overallProgress.set(percent);

    this.activeCourse.set({
      title: 'அழகுத் தமிழ் யாப்பிலக்கணம்',
      chapterName: doneCount > 0 ? `பாடம் ${doneCount + 1}: தொடர் பயிற்சி` : 'பாடம் 1: எழுத்து இலக்கணம்',
      progress: percent,
      chapterId: doneCount + 1
    });

    this.initializeModules(allCompleted);
  }

  initializeModules(completedIds: number[]): void {
    // Standard Tamil Grammar 5 Modules with dynamic calculation
    const defaultMods: DynamicModuleItem[] = [
      { id: 'ezhuthu', nameTa: 'எழுத்து', nameEn: 'Ezhuthu', totalChapters: 3, completedChapters: Math.min(completedIds.length, 3), progress: Math.min(Math.round((Math.min(completedIds.length, 3) / 3) * 100), 100), status: completedIds.length >= 3 ? 'completed' : 'in-progress', color: '#10B981' },
      { id: 'asai', nameTa: 'அசை', nameEn: 'Asai', totalChapters: 3, completedChapters: Math.max(0, Math.min(completedIds.length - 3, 3)), progress: completedIds.length <= 3 ? 0 : Math.min(Math.round((Math.max(0, completedIds.length - 3) / 3) * 100), 100), status: completedIds.length >= 6 ? 'completed' : (completedIds.length >= 3 ? 'in-progress' : 'locked'), color: '#6366F1' },
      { id: 'seer', nameTa: 'சீர்', nameEn: 'Seer', totalChapters: 3, completedChapters: Math.max(0, Math.min(completedIds.length - 6, 3)), progress: completedIds.length <= 6 ? 0 : Math.min(Math.round((Math.max(0, completedIds.length - 6) / 3) * 100), 100), status: completedIds.length >= 9 ? 'completed' : (completedIds.length >= 6 ? 'in-progress' : 'locked'), color: '#F59E0B' },
      { id: 'thalai', nameTa: 'தளை', nameEn: 'Thalai', totalChapters: 3, completedChapters: Math.max(0, Math.min(completedIds.length - 9, 3)), progress: completedIds.length <= 9 ? 0 : Math.min(Math.round((Math.max(0, completedIds.length - 9) / 3) * 100), 100), status: completedIds.length >= 12 ? 'completed' : (completedIds.length >= 9 ? 'in-progress' : 'locked'), color: '#EC4899' },
      { id: 'alagidhal', nameTa: 'அளகிடுதல்', nameEn: 'Alagidhal', totalChapters: 3, completedChapters: Math.max(0, Math.min(completedIds.length - 12, 3)), progress: completedIds.length <= 12 ? 0 : Math.min(Math.round((Math.max(0, completedIds.length - 12) / 3) * 100), 100), status: completedIds.length >= 15 ? 'completed' : (completedIds.length >= 12 ? 'in-progress' : 'locked'), color: '#8B5CF6' }
    ];
    this.dynamicModules.set(defaultMods);
  }

  fetchDashboardData(): void {
    const userId = this.authService.getUser()?.id || 1;
    this.http.get<any>(`${environment.apiUrl}/student/dashboard`).subscribe({
      next: (res) => {
        if (res) {
          if (res.streak_days !== undefined) {
            this.streakDays.set(res.streak_days);
            localStorage.setItem(`lang_app_streak_${userId}`, res.streak_days.toString());
          }
          if (res.xp_points !== undefined) {
            this.xpPoints.set(res.xp_points);
            localStorage.setItem(`lang_app_xp_${userId}`, res.xp_points.toString());
          }
          if (res.completion_percentage !== undefined) {
            this.overallProgress.set(res.completion_percentage);
          }
        }
      },
      error: () => {}
    });
  }

  continueLearning(): void {
    this.router.navigate(['/tabs/learn']);
  }

  startNextLesson(): void {
    const nextId = this.completedCount() + 1;
    this.selectChapterNode.emit(nextId);
    this.router.navigate(['/tabs/learn']);
  }

  startQuickQuiz(): void {
    this.router.navigate(['/tabs/games']);
  }

  openLeaderboard(): void {
    this.router.navigate(['/tabs/progress']);
  }

  openModule(mod: DynamicModuleItem): void {
    this.router.navigate(['/tabs/learn']);
  }
}
