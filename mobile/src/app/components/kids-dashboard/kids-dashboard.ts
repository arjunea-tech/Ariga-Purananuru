import { Component, Input, Output, EventEmitter, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import confetti from 'canvas-confetti';

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
export class KidsDashboard implements OnInit, OnDestroy {
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
  timeGreeting = signal<string>('வணக்கம்'); // Time based greeting
  
  streakDays = signal<number>(1);
  xpPoints = signal<number>(150);
  completedCount = signal<number>(0);
  totalCount = signal<number>(15);
  overallProgress = signal<number>(0);

  // Daily Goal (e.g. 15 mins a day)
  dailyGoalMins = signal<number>(15);
  dailyCompletedMins = signal<number>(12); // Simulated value
  dailyGoalProgress = signal<number>(80);

  assignedCourses = signal<any[]>([]);

  activeCourse = signal({
    title: 'கற்றல் பாடநெறி',
    chapterName: 'பாட அத்தியாயம்',
    progress: 0,
    chapterId: 1
  });

  dynamicModules = signal<DynamicModuleItem[]>([]);
  
  private carouselInterval: any;
  activeCourseIndex = signal<number>(0);
  carouselAnimation = signal<string>(''); // Used for triggering css transitions

  ngOnInit(): void {
    this.updateTimeGreeting();
    this.loadUserData();
    this.fetchDashboardData();
    this.startCourseCarousel();
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  updateTimeGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.timeGreeting.set('காலை வணக்கம்');
    } else if (hour < 17) {
      this.timeGreeting.set('மதிய வணக்கம்');
    } else {
      this.timeGreeting.set('மாலை வணக்கம்');
    }
  }

  startCourseCarousel(): void {
    this.carouselInterval = setInterval(() => {
      const courses = this.assignedCourses();
      if (courses && courses.length > 1) {
        this.carouselAnimation.set('fade-out');
        
        setTimeout(() => {
          let nextIndex = this.activeCourseIndex() + 1;
          if (nextIndex >= courses.length) {
            nextIndex = 0;
          }
          this.activeCourseIndex.set(nextIndex);
          
          const nextCourse = courses[nextIndex];
          this.activeCourse.set({
            title: nextCourse.title || nextCourse.name || 'கற்றல் பாடநெறி',
            chapterName: nextCourse.description || 'பாட அத்தியாயம்',
            progress: 0, 
            chapterId: nextCourse.id
          });
          
          this.carouselAnimation.set('fade-in');
        }, 300);
      }
    }, 3000);
  }

  loadUserData(): void {
    const user = this.authService.getUser();
    if (user && user.name) {
      const firstName = user.name.split(' ')[0];
      this.userName.set(firstName);
    }
    const userId = user?.id || 1;

    const storedStreak = localStorage.getItem(`lang_app_streak_${userId}`);
    if (storedStreak) this.streakDays.set(+storedStreak);

    const storedXp = localStorage.getItem(`lang_app_xp_${userId}`);
    if (storedXp) this.xpPoints.set(+storedXp);

    const legacyChaptersRaw = localStorage.getItem('completed_chapters');
    const scopedChaptersRaw = localStorage.getItem(`lang_app_completed_chapters_${userId}_1`);
    const legacyIds: number[] = legacyChaptersRaw ? JSON.parse(legacyChaptersRaw) : [];
    const scopedIds: number[] = scopedChaptersRaw ? JSON.parse(scopedChaptersRaw) : [];
    const allCompleted = scopedIds.length > 0 ? scopedIds : legacyIds;
    const doneCount = allCompleted.length;
    const storedProgress = localStorage.getItem(`lang_app_overall_progress_${userId}`);
    const percent = storedProgress !== null ? parseFloat(storedProgress) : 0;
    this.overallProgress.set(percent);

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

    const displayProgress = this.overallProgress();
    this.activeCourse.set({
      title: courseTitle,
      chapterName: `பாடம் ${doneCount + 1}: ${currentModuleName}`,
      progress: displayProgress,
      chapterId: doneCount + 1
    });
    
    const courses = this.assignedCourses();
    if (courses && courses.length > 0) {
      const firstCourse = courses[0];
      this.activeCourse.set({
        title: firstCourse.title || firstCourse.name || courseTitle,
        chapterName: firstCourse.description || `பாடம் ${doneCount + 1}: ${currentModuleName}`,
        progress: displayProgress,
        chapterId: firstCourse.id || doneCount + 1
      });
      this.activeCourseIndex.set(0);
    }

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
            localStorage.setItem(`lang_app_overall_progress_${userId}`, res.completion_percentage.toString());
            // Sync active course card progress with exact server progress
            this.activeCourse.update(ac => ({ ...ac, progress: res.completion_percentage }));
          }
        }
      },
      error: () => {}
    });
  }

  triggerConfetti(): void {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899']
    });
  }

  continueLearning(): void {
    this.router.navigate(['/tabs/learn']);
  }

  startNextLesson(): void {
    this.triggerConfetti();
    setTimeout(() => {
      const courses = this.assignedCourses();
      const activeIdx = this.activeCourseIndex();
      if (courses && courses[activeIdx]) {
        this.openCourse(courses[activeIdx]);
      } else {
        const nextId = this.completedCount() + 1;
        this.selectChapterNode.emit(nextId);
        this.router.navigate(['/tabs/learn']);
      }
    }, 600); // Wait for confetti before navigating
  }

  startQuickQuiz(): void {
    this.triggerConfetti();
    setTimeout(() => {
      this.router.navigate(['/tabs/games']);
    }, 400);
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
      'ezhuthu': '#FFF3C7',
      'asai': '#E0F4FF',
      'seer': '#E2FBE8',
      'thalai': '#FDE2EC',
      'alagidhal': '#F3E8FF'
    };
    return bgs[id] || '#F3F4F6';
  }

  getCategoryIcon(id: string): string {
    const icons: Record<string, string> = {
      'ezhuthu': '🔤',
      'asai': '🔢',
      'seer': '🦁',
      'thalai': '🟢',
      'alagidhal': '🌟'
    };
    return icons[id] || '📚';
  }
}
