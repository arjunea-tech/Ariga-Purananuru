import { Component, Input, Output, EventEmitter, signal, inject, OnInit, OnDestroy } from '@angular/core';

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
  imports: [],
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
  userAvatar = signal<string | null>(null);
  timeGreeting = signal<string>('வணக்கம்'); // Time based greeting
  
  streakDays = signal<number>(0);
  xpPoints = signal<number>(0);
  completedCount = signal<number>(0);
  totalCount = signal<number>(0);
  overallProgress = signal<number>(0);

  // Daily Goal (e.g. 15 mins a day)
  dailyGoalMins = signal<number>(15);
  dailyCompletedMins = signal<number>(0);
  dailyGoalProgress = signal<number>(0);

  assignedCourses = signal<any[]>([]);

  activeCourse = signal<{
    title: string;
    chapterName: string;
    progress: number;
    chapterId: number;
  } | null>(null);

  dynamicModules = signal<DynamicModuleItem[]>([]);

  currentScrollIndex = signal<number>(0);

  onCourseScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const scrollLeft = target.scrollLeft;
    const cardWidth = target.clientWidth * 0.85; // Matches the 85% min-width in CSS
    const index = Math.round(scrollLeft / cardWidth);
    if (this.currentScrollIndex() !== index) {
      this.currentScrollIndex.set(index);
    }
  }

  getCourseGradient(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', // Purple world
      'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)', // Mint/Ocean world
      'linear-gradient(120deg, #f6d365 0%, #fda085 100%)', // Sun/Fire world
      'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)', // Sky world
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' // Cherry Blossom
    ];
    return gradients[index % gradients.length];
  }

  getCourseProgressColor(index: number): string {
    const colors = ['#9C88FF', '#2ED573', '#FF6348', '#1E90FF', '#FF4757'];
    return colors[index % colors.length];
  }
  
  ngOnInit(): void {
    this.updateTimeGreeting();
    this.loadUserData();
    this.fetchCoursesAndProgress();
  }

  fetchCoursesAndProgress(): void {
    // Fetch courses first, then dashboard data to merge
    this.http.get<any[]>(`${environment.apiUrl}/courses`).subscribe({
      next: (courses) => {
        let activeCourses = courses || [];
        this.http.get<any>(`${environment.apiUrl}/student/dashboard`).subscribe({
          next: (res) => {
            if (res) {
              if (res.streak_days !== undefined) this.streakDays.set(res.streak_days);
              if (res.xp_points !== undefined) this.xpPoints.set(res.xp_points);
              if (res.completion_percentage !== undefined) this.overallProgress.set(res.completion_percentage);
              
              if (res.course_progressions && Array.isArray(res.course_progressions)) {
                activeCourses = activeCourses.map(c => {
                  const prog = res.course_progressions.find((p: any) => p.course_id === c.id);
                  return { ...c, progress: prog ? prog.percentage : 0 };
                });
              } else {
                activeCourses = activeCourses.map(c => ({ ...c, progress: 0 }));
              }

              // Sort: In-progress first, then untouched, then completed
              activeCourses.sort((a, b) => {
                const aInProgress = a.progress > 0 && a.progress < 100 ? 1 : 0;
                const bInProgress = b.progress > 0 && b.progress < 100 ? 1 : 0;
                if (aInProgress !== bInProgress) return bInProgress - aInProgress;
                
                const aUntouched = a.progress === 0 ? 1 : 0;
                const bUntouched = b.progress === 0 ? 1 : 0;
                if (aUntouched !== bUntouched) return bUntouched - aUntouched;
                
                return 0;
              });

              this.assignedCourses.set(activeCourses);

              if (res.module_progressions && Array.isArray(res.module_progressions) && res.module_progressions.length > 0) {
                const bgColors = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];
                const dynamicList: DynamicModuleItem[] = res.module_progressions.map((m: any, idx: number) => ({
                  id: m.id || `level_${idx + 1}`,
                  nameTa: m.name || `நிலை ${idx + 1}`,
                  nameEn: m.code || `Level ${idx + 1}`,
                  totalChapters: m.total_chapters || 0,
                  completedChapters: m.completed_chapters || 0,
                  progress: m.percentage || 0,
                  status: (m.percentage >= 100) ? 'completed' : 'in-progress',
                  color: m.color || bgColors[idx % bgColors.length]
                }));
                this.dynamicModules.set(dynamicList);
              } else if (res.completed_chapter_ids && Array.isArray(res.completed_chapter_ids)) {
                this.initializeModules(res.completed_chapter_ids);
              }
            }
          },
          error: () => {
            this.assignedCourses.set(activeCourses.map(c => ({ ...c, progress: 0 })));
          }
        });
      },
      error: (err) => {
        console.error('Failed to fetch assigned courses:', err);
      }
    });
  }

  ngOnDestroy(): void {
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

  loadUserData(): void {
    const user = this.authService.getUser();
    if (user && user.name) {
      const firstName = user.name.split(' ')[0];
      this.userName.set(firstName);
      if (user.avatar) {
        this.userAvatar.set(user.avatar);
      }
    }
  }

  initializeModules(completedIds: number[]): void {
    const bgColors = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];
    const defaultMods: DynamicModuleItem[] = [
      { id: 'level_1', nameTa: 'பாடப் பிரிவு 1', nameEn: 'Level 1', totalChapters: 3, completedChapters: Math.min(completedIds.length, 3), progress: Math.min(Math.round((Math.min(completedIds.length, 3) / 3) * 100), 100), status: completedIds.length >= 3 ? 'completed' : 'in-progress', color: '#10B981' }
    ];
    this.dynamicModules.set(defaultMods);
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

  startNextLesson(course: any): void {
    this.triggerConfetti();
    setTimeout(() => {
      this.openCourse(course);
    }, 600);
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
    this.router.navigate(['/tabs/learn'], { queryParams: { id: course.id, view: 'modules' } });
  }

  openModule(mod: DynamicModuleItem): void {
    this.router.navigate(['/tabs/learn']);
  }

  showAttachmentsModal = signal<boolean>(false);
  attachmentsList = signal<any[]>([]);
  isLoadingAttachments = signal<boolean>(false);

  openAttachments(): void {
    this.showAttachmentsModal.set(true);
    this.attachmentsList.set([]);
    
    const courses = this.assignedCourses();
    if (!courses || courses.length === 0) return;

    this.isLoadingAttachments.set(true);
    const requests = courses.map(course => 
      this.http.get<any>(`${environment.apiUrl}/courses/${course.id}/player-structure`)
    );

    // Dynamic resolution of structures
    import('rxjs').then(({ forkJoin }) => {
      forkJoin(requests).subscribe({
        next: (structures: any[]) => {
          const list: any[] = [];
          structures.forEach(struct => {
            if (struct && struct.levels) {
              struct.levels.forEach((lvl: any) => {
                if (lvl.chapters) {
                  lvl.chapters.forEach((chap: any) => {
                    // Check chapter level attachments if any
                    if (chap.contents) {
                      chap.contents.forEach((cont: any) => {
                        // Check if content has attachments
                        if (cont.attachments && cont.attachments.length > 0) {
                          cont.attachments.forEach((att: any) => {
                            let fileUrl = att.url || att;
                            if (fileUrl && fileUrl.startsWith('http://localhost/') && !fileUrl.includes(':8000')) {
                              fileUrl = fileUrl.replace('http://localhost/', `${environment.baseUrl}/`);
                            } else if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('data:')) {
                              fileUrl = `${environment.baseUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                            }
                            list.push({
                              courseName: struct.name || 'பாடநெறி',
                              chapterName: chap.name || 'அத்தியாயம்',
                              fileName: att.name || 'பாட புத்தகம் / ஆவணம்',
                              url: fileUrl
                            });
                          });
                        }
                        // Also scan text_content json for embedded pdf blocks
                        if (cont.text_content) {
                          try {
                            const parsed = JSON.parse(cont.text_content);
                            if (parsed.blocks) {
                              parsed.blocks.forEach((b: any) => {
                                if (b.type === 'pdf' && b.data && b.data.url) {
                                  let fileUrl = b.data.url;
                                  if (fileUrl && fileUrl.startsWith('http://localhost/') && !fileUrl.includes(':8000')) {
                                    fileUrl = fileUrl.replace('http://localhost/', `${environment.baseUrl}/`);
                                  } else if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('data:')) {
                                    fileUrl = `${environment.baseUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                                  }
                                  list.push({
                                    courseName: struct.name || 'பாடநெறி',
                                    chapterName: chap.name || 'அத்தியாயம்',
                                    fileName: b.data.title || 'பாட புத்தகம் (PDF)',
                                    url: fileUrl
                                  });
                                }
                              });
                            }
                          } catch (e) {}
                        }
                      });
                    }
                  });
                }
              });
            }
          });
          this.attachmentsList.set(list);
          this.isLoadingAttachments.set(false);
        },
        error: () => {
          this.isLoadingAttachments.set(false);
        }
      });
    });
  }

  closeAttachments(): void {
    this.showAttachmentsModal.set(false);
  }

  openPdf(url: string): void {
    console.log('Opening PDF URL:', url);
    window.open(url, '_blank');
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
