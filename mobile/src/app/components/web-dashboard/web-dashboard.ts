import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';

export interface WebCourseItem {
  id: number;
  title: string;
  desc: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'locked';
  icon: string;
  colorBg: string;
  colorText: string;
}

export interface WebLevelItem {
  id: number | string;
  name: string;
  desc: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'locked';
  icon: string;
  colorBg: string;
  colorText: string;
  chapters: LessonItem[];
}

export interface AttachmentItem {
  name: string;
  size: string;
  type: string;
  icon: string;
  color: string;
  url: string;
  courseName?: string;
  chapterName?: string;
}

export interface LessonItem {
  id: number;
  chapterId?: number;
  title: string;
  desc: string;
  status: 'completed' | 'current' | 'locked';
  actionLabel: string;
}

export interface GameItem {
  id: string;
  title: string;
  desc: string;
  type: string;
  icon: string;
  color: string;
  chapterId?: number;
}

export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  icon: string;
  url?: string;
}

export interface AchievementItem {
  name: string;
  title?: string;
  icon: string;
  unlocked: boolean;
  bg?: string;
}

@Component({
  selector: 'app-web-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './web-dashboard.html',
  styleUrls: ['./web-dashboard.css']
})
export class WebDashboardComponent implements OnInit {
  protected authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  activeView = signal<'home' | 'learn' | 'practice' | 'progress' | 'profile'>('home');
  selectedTabForModule = signal<'lesson' | 'game' | 'video' | 'document'>('lesson');
  isMobileMenuOpen = signal<boolean>(false);

  userName = signal<string>('மாணவர்');
  userAvatar = signal<string | null>(null);
  userRole = signal<string>('STUDENT · மாணவர்');
  timeGreeting = signal<string>('வணக்கம்');

  streakDays = signal<number>(0);
  xpPoints = signal<number>(0);
  overallProgress = signal<number>(0);
  accuracyPct = signal<number>(0);
  studiedMins = signal<number>(0);
  questionsAnswered = signal<number>(0);
  correctAnswers = signal<number>(0);
  wrongAnswers = signal<number>(0);

  searchQuery = signal<string>('');

  // Course & Level Data
  assignedCourses = signal<WebCourseItem[]>([]);
  activeHeroCourse = signal<WebCourseItem | null>(null);

  courseLevels = signal<WebLevelItem[]>([]);
  selectedLevel = signal<WebLevelItem | null>(null);

  // Dynamic Module Breakdown
  moduleProgressList = signal<any[]>([]);

  // Document attachments list
  attachments = signal<AttachmentItem[]>([]);
  isLoadingAttachments = signal<boolean>(false);

  // Selected Course / Module Details
  selectedCourseId = signal<number | null>(null);
  selectedCourseTitle = signal<string>('');
  selectedCourseDesc = signal<string>('');

  moduleLessons = signal<LessonItem[]>([]);
  moduleGames = signal<GameItem[]>([]);
  moduleVideos = signal<VideoItem[]>([]);
  moduleDocuments = signal<AttachmentItem[]>([]);

  // Weekly Activity
  weeklyActivity = signal<any[]>([]);

  // Profile achievements
  achievements = signal<AchievementItem[]>([]);

  ngOnInit(): void {
    this.updateTimeGreeting();
    this.loadUserData();
    this.fetchCoursesAndProgress();
    this.fetchAnnouncements();
  }

  updateTimeGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.timeGreeting.set('காலை வணக்கம்');
    else if (hour < 17) this.timeGreeting.set('மதிய வணக்கம்');
    else this.timeGreeting.set('மாலை வணக்கம்');
  }

  loadUserData(): void {
    const user = this.authService.getUser();
    if (user && user.name) {
      const firstName = user.name.split(' ')[0];
      this.userName.set(firstName);
      if (user.role) {
        this.userRole.set(`${user.role.toUpperCase()} · மாணவர்`);
      }
      if (user.avatar) this.userAvatar.set(user.avatar);
    }
  }

  fetchCoursesAndProgress(): void {
    // 1. Fetch courses list
    this.http.get<any[]>(`${environment.apiUrl}/courses`).subscribe({
      next: (courses) => {
        let rawCourses = courses || [];

        // 2. Fetch student dashboard progressions
        this.http.get<any>(`${environment.apiUrl}/student/dashboard`).subscribe({
          next: (res) => {
            if (res) {
              if (res.streak_days !== undefined) this.streakDays.set(res.streak_days);
              if (res.xp_points !== undefined) this.xpPoints.set(res.xp_points);
              if (res.completion_percentage !== undefined) this.overallProgress.set(res.completion_percentage);
              if (res.today_mins !== undefined) this.studiedMins.set(res.today_mins);
              if (res.questions_answered !== undefined) this.questionsAnswered.set(res.questions_answered);
              if (res.correct_answers !== undefined) this.correctAnswers.set(res.correct_answers);
              if (res.wrong_answers !== undefined) this.wrongAnswers.set(res.wrong_answers);
              if (res.accuracy_pct !== undefined) this.accuracyPct.set(res.accuracy_pct);
              if (res.weekly_activity && Array.isArray(res.weekly_activity)) {
                this.weeklyActivity.set(res.weekly_activity);
              }

              // Merge course progression data
              let merged: WebCourseItem[] = rawCourses.map((c: any, idx: number) => {
                const prog = (res.course_progressions || []).find((p: any) => p.course_id === c.id);
                const pct = prog ? prog.percentage : 0;
                let status: 'completed' | 'in-progress' | 'locked' = 'in-progress';
                if (pct >= 100) status = 'completed';
                else if (pct === 0 && idx > 2) status = 'locked';

                const icons = ['bi-book-fill', 'bi-journal-code', 'bi-chat-quote-fill', 'bi-layers-fill', 'bi-puzzle-fill'];
                const bgs = ['#EEF2FF', '#ECFDF5', '#FEF3C7', '#F3E8FF', '#FFE4E6'];
                const colors = ['#4F46E5', '#10B981', '#D97706', '#7C3AED', '#E11D48'];

                return {
                  id: c.id,
                  title: c.name || c.title || `பாடநெறி ${c.id}`,
                  desc: c.description || 'அடிப்படை பாடங்கள் மற்றும் பயிற்சிகள்.',
                  progress: pct,
                  status: status,
                  icon: icons[idx % icons.length],
                  colorBg: bgs[idx % bgs.length],
                  colorText: colors[idx % colors.length]
                };
              });

              this.assignedCourses.set(merged);

              // Set active Hero course
              const hero = merged.find(c => c.progress > 0 && c.progress < 100) || merged[0];
              if (hero) {
                this.activeHeroCourse.set(hero);
                this.fetchCourseModules(hero.id);
              } else {
                this.activeHeroCourse.set(null);
              }

              // Set module breakdown
              if (res.module_progressions && Array.isArray(res.module_progressions)) {
                this.moduleProgressList.set(res.module_progressions);
              }

              // Set achievements
              if (res.earned_badges && Array.isArray(res.earned_badges)) {
                this.achievements.set(res.earned_badges);
              }

              // Load PDF attachments
              this.fetchDynamicAttachments(merged);
            }
          },
          error: (err) => {
            console.log('Error fetching student dashboard', err);
            this.assignedCourses.set([]);
            this.activeHeroCourse.set(null);
          }
        });
      },
      error: (err) => {
        console.log('Error fetching courses', err);
        this.assignedCourses.set([]);
        this.activeHeroCourse.set(null);
      }
    });
  }

  fetchCourseModules(courseId: number): void {
    this.selectedCourseId.set(courseId);
    this.http.get<any>(`${environment.apiUrl}/courses/${courseId}/player-structure`).subscribe({
      next: (struct) => {
        if (struct) {
          const icons = ['bi-book-fill', 'bi-journal-code', 'bi-chat-quote-fill', 'bi-layers-fill', 'bi-puzzle-fill'];
          const bgs = ['#EEF2FF', '#ECFDF5', '#FEF3C7', '#F3E8FF', '#FFE4E6'];
          const colors = ['#4F46E5', '#10B981', '#D97706', '#7C3AED', '#E11D48'];

          let parsedLevels: WebLevelItem[] = [];

          // Case A: Backend returns distinct levels array
          if (struct.levels && Array.isArray(struct.levels) && struct.levels.length > 0) {

            if (struct.levels.length > 1) {
              parsedLevels = struct.levels.map((lvl: any, idx: number) => {
                const chapters: LessonItem[] = (lvl.chapters || []).map((chap: any, cIdx: number) => ({
                  id: cIdx + 1,
                  chapterId: chap.id,
                  title: `${cIdx + 1}. ${chap.name || 'பாட அத்தியாயம்'}`,
                  desc: chap.description || chap.desc || 'அடிப்படை இலக்கண விளக்கம் மற்றும் உதாரணங்கள்.',
                  status: chap.completed ? 'completed' : 'current',
                  actionLabel: chap.completed ? 'மீண்டும் கற்க' : 'தொடர்க'
                }));

                const completedCount = chapters.filter(c => c.status === 'completed').length;
                const pct = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;
                let status: 'completed' | 'in-progress' | 'locked' = pct >= 100 ? 'completed' : 'in-progress';

                return {
                  id: lvl.id || `lvl_${idx + 1}`,
                  name: lvl.name || `தொகுதி ${idx + 1}`,
                  desc: lvl.description || lvl.desc || 'தமிழ் இலக்கணத்தின் அடிப்படை விதிகள் மற்றும் விளக்கம்.',
                  progress: pct,
                  status: status,
                  icon: icons[idx % icons.length],
                  colorBg: bgs[idx % bgs.length],
                  colorText: colors[idx % colors.length],
                  chapters: chapters
                };
              });
            } else {
              const allChapters: any[] = struct.levels[0]?.chapters || [];
              parsedLevels = this.groupChaptersIntoLevels(allChapters);
            }
          }

          this.courseLevels.set(parsedLevels);

          const defaultLvl = parsedLevels.find(l => l.status === 'in-progress') || parsedLevels[0];
          if (defaultLvl) {
            this.selectLevel(defaultLvl);
          } else {
            this.selectedLevel.set(null);
            this.moduleLessons.set([]);
          }
        }
      },
      error: () => {
        this.courseLevels.set([]);
        this.selectedLevel.set(null);
        this.moduleLessons.set([]);
      }
    });
  }

  groupChaptersIntoLevels(chapters: any[]): WebLevelItem[] {
    const icons = ['bi-book-fill', 'bi-journal-code', 'bi-chat-quote-fill', 'bi-layers-fill', 'bi-puzzle-fill'];
    const bgs = ['#EEF2FF', '#ECFDF5', '#FEF3C7', '#F3E8FF', '#FFE4E6'];
    const colors = ['#4F46E5', '#10B981', '#D97706', '#7C3AED', '#E11D48'];

    const chunkSize = Math.max(1, Math.ceil(chapters.length / 5));
    const totalLevels = Math.ceil(chapters.length / chunkSize);

    return Array.from({ length: totalLevels }, (_, idx) => {
      const slice = chapters.slice(idx * chunkSize, (idx + 1) * chunkSize);
      const levelChapters: LessonItem[] = slice.map((chap: any, cIdx: number) => ({
        id: cIdx + 1,
        chapterId: chap.id,
        title: `${cIdx + 1}. ${chap.name || 'பாட அத்தியாயம்'}`,
        desc: chap.description || chap.desc || '',
        status: chap.completed ? 'completed' : 'current',
        actionLabel: chap.completed ? 'மீண்டும் கற்க' : 'தொடர்க'
      }));

      const completedCount = levelChapters.filter(c => c.status === 'completed').length;
      const pct = levelChapters.length > 0 ? Math.round((completedCount / levelChapters.length) * 100) : 0;
      const status: 'completed' | 'in-progress' | 'locked' = pct >= 100 ? 'completed' : 'in-progress';

      const firstName = slice[0]?.name || '';
      const levelName = firstName ? `தொகுதி ${idx + 1}: ${firstName}` : `தொகுதி ${idx + 1}`;

      return {
        id: `lvl_${idx + 1}`,
        name: levelName,
        desc: slice[0]?.description || slice[0]?.desc || '',
        progress: pct,
        status,
        icon: icons[idx % icons.length],
        colorBg: bgs[idx % bgs.length],
        colorText: colors[idx % colors.length],
        chapters: levelChapters
      };
    });
  }



  selectLevel(level: WebLevelItem): void {
    this.selectedLevel.set(level);
    this.selectedCourseTitle.set(level.name);
    this.selectedCourseDesc.set(level.desc);
    this.moduleLessons.set(level.chapters);

    // Populate Games for this level
    this.moduleGames.set([
      {
        id: `g1_${level.id}`,
        title: 'சரியான விடையைத் தேர்ந்தெடு (MCQ Quiz)',
        desc: `${level.name} தொடர்பான கொள்குறி வினாடி வினா.`,
        type: 'mcq',
        icon: 'bi-ui-radios',
        color: '#3B82F6'
      },
      {
        id: `g2_${level.id}`,
        title: 'அசை வெட்டு & சீர்ப் புதிர் (Asai Slice)',
        desc: `${level.name} சீர் மற்றும் அசை பிரித்தல் விளையாட்டு.`,
        type: 'yappu_asai_slice',
        icon: 'bi-scissors',
        color: '#8B5CF6'
      },
      {
        id: `g3_${level.id}`,
        title: 'வார்த்தை தேடல் (Word Hunt)',
        desc: 'குறிப்பிட்ட நேரத்தில் தமிழ் வார்த்தைகளைக் கண்டுபிடி.',
        type: 'word_hunt',
        icon: 'bi-search',
        color: '#10B981'
      },
      {
        id: `g4_${level.id}`,
        title: 'எழுத்து கூடை (Letter Basket)',
        desc: 'எழுத்துக்களைச் சரியான கூடையில் வரிசைப்படுத்து.',
        type: 'letter_basket',
        icon: 'bi-basket2-fill',
        color: '#F59E0B'
      }
    ]);

    // Populate Videos for this level
    this.moduleVideos.set([
      {
        id: `v1_${level.id}`,
        title: `${level.name} - பாட விளக்கக் காணொளி 01`,
        duration: '06:15 min',
        icon: 'bi-play-circle-fill'
      },
      {
        id: `v2_${level.id}`,
        title: `${level.name} - செய்முறைப் பயிற்சி காணொளி 02`,
        duration: '04:45 min',
        icon: 'bi-play-circle-fill'
      }
    ]);

    // Populate Documents for this level
    const levelSlug = (level.name || 'பாடநூல்').replace(/\s+/g, '_');
    this.moduleDocuments.set([
      {
        name: `${levelSlug}_பாடநூல்_விளக்கம்.pdf`,
        size: '2.4 MB',
        type: 'pdf',
        icon: 'bi-file-earmark-pdf-fill',
        color: '#EF4444',
        url: ''
      },
      {
        name: `${levelSlug}_பயிற்சித்தாள்.pdf`,
        size: '1.2 MB',
        type: 'pdf',
        icon: 'bi-file-earmark-pdf-fill',
        color: '#EF4444',
        url: ''
      }
    ]);
  }

  fetchDynamicAttachments(courses: WebCourseItem[]): void {
    if (!courses || courses.length === 0) return;

    this.isLoadingAttachments.set(true);
    const requests = courses.slice(0, 5).map(c =>
      this.http.get<any>(`${environment.apiUrl}/courses/${c.id}/player-structure`)
    );

    forkJoin(requests).subscribe({
      next: (structures: any[]) => {
        const fileList: AttachmentItem[] = [];
        structures.forEach(struct => {
          if (struct && struct.levels) {
            struct.levels.forEach((lvl: any) => {
              if (lvl.chapters) {
                lvl.chapters.forEach((chap: any) => {
                  if (chap.contents) {
                    chap.contents.forEach((cont: any) => {
                      if (cont.attachments && cont.attachments.length > 0) {
                        cont.attachments.forEach((att: any) => {
                          const isPdf = (att.file_extension || '').toLowerCase() === 'pdf';
                          const downloadUrl = `${environment.apiUrl}/attachments/${att.id}/download` + (isPdf ? '?disposition=inline' : '?disposition=attachment');
                          fileList.push({
                            name: att.alias_name || att.original_name || (isPdf ? 'பாட புத்தகம்.pdf' : 'பாட ஆவணம்.docx'),
                            size: att.file_size || '2.4 MB',
                            type: isPdf ? 'pdf' : 'doc',
                            icon: isPdf ? 'bi-file-earmark-pdf-fill' : 'bi-file-earmark-word-fill',
                            color: isPdf ? '#EF4444' : '#3B82F6',
                            url: downloadUrl,
                            courseName: struct.name,
                            chapterName: chap.name
                          });
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });

        if (fileList.length > 0) {
          this.attachments.set(fileList);
        }
        this.isLoadingAttachments.set(false);
      },
      error: () => this.isLoadingAttachments.set(false)
    });
  }



  getFilteredLevels(): WebLevelItem[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.courseLevels();
    return this.courseLevels().filter(l =>
      l.name.toLowerCase().includes(q) || l.desc.toLowerCase().includes(q)
    );
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  setActiveView(view: 'home' | 'learn' | 'practice' | 'progress' | 'profile'): void {
    this.activeView.set(view);
    this.closeMobileMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showAnnouncementsModal = signal<boolean>(false);
  announcements = signal<any[]>([]);
  loadingAnnouncements = signal<boolean>(false);

  fetchAnnouncements(): void {
    this.loadingAnnouncements.set(true);
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    this.http.get<any[]>(`${environment.apiUrl}/announcements`, { headers }).subscribe({
      next: (data) => {
        this.announcements.set(data || []);
        this.loadingAnnouncements.set(false);
      },
      error: (err) => {
        console.error('Failed to load announcements', err);
        this.loadingAnnouncements.set(false);
      }
    });
  }

  goToAnnouncements(): void {
    this.showAnnouncementsModal.set(true);
    this.fetchAnnouncements();
  }

  closeAnnouncements(): void {
    this.showAnnouncementsModal.set(false);
  }

  selectModuleTab(tab: 'lesson' | 'game' | 'video' | 'document'): void {
    this.selectedTabForModule.set(tab);
  }

  startPractice(): void {
    this.setActiveView('practice');
  }

  launchPracticeGame(gameType?: string): void {
    const cid = this.selectedCourseId() || (this.assignedCourses()[0]?.id) || 1;
    this.router.navigate(['/learn/play', cid], {
      queryParams: {
        view: 'game-mode',
        gameType: gameType || 'letter_hunt'
      }
    });
  }

  openCourse(course: WebCourseItem): void {
    this.fetchCourseModules(course.id);
    this.setActiveView('learn');
  }

  startLesson(lesson: LessonItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const cid = this.selectedCourseId() || (this.assignedCourses()[0]?.id) || 1;
    const tab = this.selectedTabForModule();

    if (tab === 'game') {
      this.router.navigate(['/learn/play', cid], {
        queryParams: {
          view: 'game-mode',
          chapterId: lesson.chapterId || lesson.id,
          moduleId: this.selectedLevel()?.id
        }
      });
    } else {
      this.router.navigate(['/learn/play', cid], {
        queryParams: {
          view: 'content',
          chapterId: lesson.chapterId || lesson.id
        }
      });
    }
  }

  openFile(url: string): void {
    if (url) window.open(url, '_blank');
  }

  logout(): void {
    this.authService.clearSession();
    this.authService.logout().subscribe({ error: () => { } });
    this.router.navigate(['/']);
  }
}
