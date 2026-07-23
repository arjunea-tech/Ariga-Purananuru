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

  assignedCourses = signal<any[]>([]);

  activeCourse = signal({
    title: 'கற்றல் பாடநெறி',
    chapterName: 'பாட அத்தியாயம்',
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
      const firstName = user.name.split(' ')[0];
      this.userName.set(firstName);
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

    const currentModuleIndex = Math.min(Math.floor(doneCount / 3), 4);
    // Try to get real course title and chapter name dynamically
    let courseTitle = 'கற்றல் பாடநெறி';
    let currentModuleName = 'பாட அத்தியாயம்';
    try {
      const cachedCourses = localStorage.getItem('lang_app_courses_list');
      const lastCourseId = localStorage.getItem('lang_app_last_course_id');
      if (cachedCourses) {
        const courses = JSON.parse(cachedCourses);
        if (courses && courses.length > 0) {
          this.assignedCourses.set(courses);
        }
        const matched = lastCourseId ? courses.find((c: any) => c.id.toString() === lastCourseId) : null;
        const course = matched || courses[0];
        if (course && (course.title || course.name)) {
          courseTitle = course.title || course.name;
        }
      }

      // Also try to get real structure to get the current chapter name
      const cachedStructureRaw = localStorage.getItem('lang_app_course_structure');
      if (cachedStructureRaw) {
        const struct = JSON.parse(cachedStructureRaw);
        if (struct.levels && struct.levels.length > 0) {
          const allChapters: any[] = [];
          struct.levels.forEach((lvl: any) => {
            if (lvl.chapters) allChapters.push(...lvl.chapters);
          });
          const currChap = allChapters[doneCount] || allChapters[0];
          if (currChap) {
            currentModuleName = currChap.name || currChap.title || 'பாட அத்தியாயம்';
          }
        }
      }
    } catch (e) {}

    this.activeCourse.set({
      title: courseTitle,
      chapterName: `பாடம் ${doneCount + 1}: ${currentModuleName}`,
      progress: percent,
      chapterId: doneCount + 1
    });

    this.initializeModules(allCompleted);
  }

  initializeModules(completedIds: number[]): void {
    const cachedStructureRaw = localStorage.getItem('lang_app_course_structure');
    if (cachedStructureRaw) {
      try {
        const struct = JSON.parse(cachedStructureRaw);
        if (struct.levels && Array.isArray(struct.levels) && struct.levels.length > 0) {
          const bgColors = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];
          const dynamicList: DynamicModuleItem[] = struct.levels.map((lvl: any, idx: number) => {
            const chaps = lvl.chapters || [];
            const doneInLevel = chaps.filter((c: any) => completedIds.includes(c.id)).length;
            const isDone = chaps.length > 0 && doneInLevel === chaps.length;
            return {
              id: lvl.id ? String(lvl.id) : `level_${idx + 1}`,
              nameTa: lvl.name || `நிலை ${idx + 1}`,
              nameEn: lvl.code || `Level ${idx + 1}`,
              totalChapters: chaps.length,
              completedChapters: doneInLevel,
              progress: chaps.length > 0 ? Math.round((doneInLevel / chaps.length) * 100) : 0,
              status: isDone ? 'completed' : 'in-progress',
              color: bgColors[idx % bgColors.length]
            };
          });
          this.dynamicModules.set(dynamicList);
          return;
        }
      } catch (e) {}
    }

    const defaultMods: DynamicModuleItem[] = [
      { id: 'level_1', nameTa: 'பாடப் பிரிவு 1', nameEn: 'Level 1', totalChapters: 3, completedChapters: Math.min(completedIds.length, 3), progress: Math.min(Math.round((Math.min(completedIds.length, 3) / 3) * 100), 100), status: completedIds.length >= 3 ? 'completed' : 'in-progress', color: '#10B981' }
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

  openCourse(course: any): void {
    localStorage.setItem('lang_app_last_course_id', course.id.toString());
    this.router.navigate(['/tabs/learn'], { queryParams: { view: 'modules' } });
  }

  openModule(mod: DynamicModuleItem): void {
    this.router.navigate(['/tabs/learn']);
  }

  getCategoryBg(id: string): string {
    const bgs: Record<string, string> = {
      'ezhuthu': '#FFF3C7', // pastel yellow
      'asai': '#E0F4FF', // pastel blue
      'seer': '#E2FBE8', // pastel green
      'thalai': '#FDE2EC', // pastel pink
      'alagidhal': '#F3E8FF' // pastel purple
    };
    return bgs[id] || '#F3F4F6';
  }

  getCategoryIcon(id: string): string {
    const icons: Record<string, string> = {
      'ezhuthu': '🔤', // ABC equivalent
      'asai': '🔢',  // Numbers equivalent
      'seer': '🦁',  // Animals
      'thalai': '🟢', // Shapes
      'alagidhal': '🌟'
    };
    return icons[id] || '📚';
  }
}
