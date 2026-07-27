import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

export interface LessonStep {
  type: 'intro' | 'video' | 'pdf' | 'reading' | 'activity' | 'assessment' | 'practice' | 'remediation';
  title: string;
  activity_id?: string;
  data: any;
}

interface Chapter {
  id: number;
  name: string;
  contents: Content[];
  assessments?: any[];
  is_expanded?: boolean;
}

interface Level {
  id: number;
  name: string;
  chapters: Chapter[];
  is_expanded?: boolean;
}

interface CourseStructure {
  id: number;
  name: string;
  description?: string;
  levels: Level[];
}

import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ActivityRenderer } from '../activity-engine/activity-renderer/activity-renderer';
import { CourseService } from '../../services/course';
import { KidsDashboard } from '../kids-dashboard/kids-dashboard';
import { StudentDashboard } from '../student-dashboard/student-dashboard';
import { KidsLessonPlayer } from '../kids-lesson-player/kids-lesson-player';
import confetti from 'canvas-confetti';
import { gsap } from 'gsap';
import { AudioService } from '../../services/audio.service';
import { AuthService } from '../../services/auth';

interface Content {
  id: number;
  name: string;
  title?: string;
  text_content?: string;
  attachments?: any[];
  external_url?: any[];
  assessments?: any[];
  sort_order?: number;
  is_active?: boolean;
}

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, RouterModule, KidsDashboard, StudentDashboard, KidsLessonPlayer],
  templateUrl: './course-player.html',
  styleUrls: ['./course-player.css']
})
export class CoursePlayer implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private audioService = inject(AudioService);
  private authService = inject(AuthService);
  private location = inject(Location);

  courseId = signal<number | null>(null);
  userId = signal<number>(1);

  courseStructure = signal<CourseStructure | null>(null);
  activeContentId = signal<number | null>(null);
  fullContent = signal<Content | null>(null);
  isFullscreen = signal(false);
  currentView = signal<'levels' | 'map' | 'content' | 'activity' | 'game-mode'>('levels');
  theme = signal<'kids' | 'student'>('kids'); // New theme signal
  currentActivityIndex = signal<number>(0);
  activeLevelId = signal<number | null>(null);
  activeChapterId = signal<number | null>(null);

  completedLevelIds = signal<number[]>([]);
  completedChapterIds = signal<number[]>([]);

  lessonSequence = signal<LessonStep[]>([]);
  isLoadingLesson = signal<boolean>(true);
  isLoadingMap = signal<boolean>(false);
  private mapLoadTimer: any = null;
  currentStepIndex = signal<number>(0);
  learningMode = signal<'strict' | 'easy'>('easy'); // Strict mode prevents skipping activities
  isStepCompleted = signal<boolean>(false);
  isVideoCompleted = signal<boolean>(false);
  lessonFinished = signal<boolean>(false);

  hearts = signal<number>(5);
  coins = signal<number>(85);
  xp = signal<number>(1250);
  showGameOver = signal<boolean>(false);
  showCorrectSplash = signal<boolean>(false);
  showIncorrectSplash = signal<boolean>(false);
  activityFeedbackState = signal<'correct' | 'incorrect' | null>(null);
  heartRefillTimer = signal<number>(0);
  private timerInterval: any;

  showRewardModal = signal<boolean>(false);
  rewardData = signal<{ xp_earned: number, badges: any[] } | null>(null);

  constructor() { }

  mascotWarning = signal<string | null>(null);
  showMascotWarning = signal<boolean>(false);

  triggerMascotWarning(message: string) {
    this.mascotWarning.set(message);
    this.showMascotWarning.set(true);
    setTimeout(() => {
      this.showMascotWarning.set(false);
    }, 3000);
  }

  selectedLevel = computed(() => {
    const structure = this.courseStructure();
    const levId = this.activeLevelId();
    if (!structure || !levId) return null;
    return structure.levels.find(l => l.id === levId) || null;
  });

  levelThemeClass = computed(() => {
    const structure = this.courseStructure();
    const levId = this.activeLevelId();
    if (!structure || !levId) return 'theme-forest';
    const idx = structure.levels.findIndex(l => l.id === levId);
    if (idx < 0) return 'theme-forest';
    if (idx % 2 === 0) return 'theme-forest';
    return 'theme-desert';
  });

  selectedChapter = computed(() => {
    const chapId = this.activeChapterId();
    const structure = this.courseStructure();
    if (!chapId || !structure) return null;
    // First try with the active level for performance
    const level = this.selectedLevel();
    if (level) {
      const found = level.chapters.find(c => c.id === chapId);
      if (found) return found;
    }
    // Fallback: search all levels (handles case when only chapterId is in URL)
    for (const l of structure.levels) {
      const found = l.chapters.find(c => c.id === chapId);
      if (found) return found;
    }
    return null;
  });

  activeContent = computed(() => {
    const id = this.activeContentId();
    const full = this.fullContent();

    if (!id || !this.courseStructure()) return null;

    if (full && full.id === id) {
      for (const level of this.courseStructure()!.levels) {
        for (const chapter of level.chapters) {
          const topic = chapter.contents.find(c => c.id === id);
          if (topic) {
            const contentAssessments = full.assessments || [];
            const chapterAssessments = chapter.assessments || [];
            const allAssessments = [...contentAssessments, ...chapterAssessments];
            return { ...full, assessments: allAssessments };
          }
        }
      }
      return full;
    }

    for (const level of this.courseStructure()!.levels) {
      for (const chapter of level.chapters) {
        const content = chapter.contents.find(c => c.id === id);
        if (content) {
          return { ...content, assessments: chapter.assessments };
        }
      }
    }
    return null;
  });


  currentStep = computed(() => {
    const seq = this.lessonSequence();
    const idx = this.currentStepIndex();
    if (seq.length > 0 && idx >= 0 && idx < seq.length) {
      return seq[idx];
    }
    return null;
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const cid = params['courseId'] ? +params['courseId'] : null;
      if (cid) {
        if (cid !== this.courseId()) {
          this.courseId.set(cid);
        }
        // Always refresh structure from API on init to prevent stale cache
        this.loadStructure();
      } else if (this.courseId()) {
        this.loadStructure();
      }
    });

    this.route.queryParams.subscribe(params => {
      const qid = params['id'] ? +params['id'] : null;
      if (qid && qid !== this.courseId()) {
        this.courseId.set(qid);
        this.loadStructure();
      }

      const rawView = params['view'];
      const view: 'levels' | 'map' | 'content' | 'activity' | 'game-mode' =
        (rawView === 'map' || rawView === 'content' || rawView === 'activity' || rawView === 'game-mode') ? rawView : 'levels';
      const levelId = params['levelId'] ? +params['levelId'] : null;
      const chapterId = params['chapterId'] ? +params['chapterId'] : null;
      const gameType = params['gameType'];
      const moduleId = params['moduleId'];

      // If navigating BACK to levels, immediately cancel any pending map loader
      if (view === 'levels' && this.isLoadingMap()) {
        if (this.mapLoadTimer) { clearTimeout(this.mapLoadTimer); this.mapLoadTimer = null; }
        this.isLoadingMap.set(false);
      }

      if (levelId && levelId !== this.activeLevelId()) {
        this.activeLevelId.set(levelId);
      }

      if (view !== this.currentView()) {
        this.currentView.set(view);
      }

      if (view === 'game-mode' && gameType && moduleId) {
        if (this.courseStructure()) {
          this.loadGameModeSequence(moduleId, gameType);
        }
      } else if (chapterId && chapterId !== this.activeChapterId()) {
        this.activeChapterId.set(chapterId);
        if (this.courseStructure()) {
          this.loadLessonSequence(chapterId);
        }
        // else: initializeStructure() will call loadLessonSequence on its own
      } else if (!chapterId && this.activeChapterId()) {
        this.activeChapterId.set(null);
      }
    });
  }

  loadStructure(): void {
    const currentCid = this.courseId();
    if (!currentCid) {
      this.http.get<any[]>(`${environment.apiUrl}/courses`).subscribe({
        next: (courses) => {
          if (courses && courses.length > 0) {
            this.courseId.set(courses[0].id);
            this.loadStructure();
          }
        },
        error: () => { }
      });
      return;
    }

    const cid = currentCid || this.courseId() || 1;
    const url = `${environment.apiUrl}/courses/${cid}/player-structure`;
    this.http.get<CourseStructure>(url).subscribe({
      next: (structure) => {
        this.initializeStructure(structure);
      },
      error: () => {
        this.courseStructure.set(null);
        this.http.get<any[]>(`${environment.apiUrl}/courses`).subscribe({
          next: (courses) => {
            if (courses && courses.length > 0 && courses[0].id !== currentCid) {
              this.courseId.set(courses[0].id);
              this.loadStructure();
            }
          },
          error: () => { }
        });
      }
    });
  }

  initializeStructure(structure: CourseStructure): void {
    structure.levels.forEach((l, idx) => {
      l.is_expanded = idx === 0;
      l.chapters.forEach((c, cidx) => {
        c.is_expanded = idx === 0 && cidx === 0;
      });
    });
    this.courseStructure.set(structure);
    this.loadDatabaseProgress();

    const params = this.route.snapshot.queryParams;
    const chapterId = params['chapterId'] ? +params['chapterId'] : null;
    const gameType = params['gameType'];
    const moduleId = params['moduleId'];

    if (params['view'] === 'game-mode' && gameType && moduleId) {
      this.loadGameModeSequence(moduleId, gameType);
    } else if (chapterId) {
      this.loadLessonSequence(chapterId);
    }
  }

  loadDatabaseProgress(): void {
    const cid = this.courseId();
    if (!cid) return;
    // Always fetch direct from database API
    this.http.get<any>(`${environment.apiUrl}/student/dashboard`).subscribe({
      next: (res) => {
        if (res && res.completed_chapter_ids && Array.isArray(res.completed_chapter_ids)) {
          this.completedChapterIds.set(res.completed_chapter_ids);
        }
      },
      error: () => { }
    });
  }

  saveLocalProgress(): void {
    const cid = this.courseId();
    if (!cid) return;
    const uid = this.userId();
    try {
      const levelsKey = `lang_app_completed_levels_${uid}_${cid}`;
      const chaptersKey = `lang_app_completed_chapters_${uid}_${cid}`;
      localStorage.setItem(levelsKey, JSON.stringify(this.completedLevelIds()));
      localStorage.setItem(chaptersKey, JSON.stringify(this.completedChapterIds()));

      // Synchronize with legacy global keys and module completion keys
      const existingLegacyRaw = localStorage.getItem('completed_chapters');
      const existingLegacy: number[] = existingLegacyRaw ? JSON.parse(existingLegacyRaw) : [];
      const mergedChapters = Array.from(new Set([...existingLegacy, ...this.completedChapterIds()]));
      localStorage.setItem('completed_chapters', JSON.stringify(mergedChapters));

      if (mergedChapters.length > 0) {
        const activeLevel = this.activeLevelId() ? String(this.activeLevelId()) : 'level_1';
        localStorage.setItem(`${activeLevel}_completed`, 'true');
        const completedModsRaw = localStorage.getItem('completed_modules');
        const completedMods: string[] = completedModsRaw ? JSON.parse(completedModsRaw) : [];
        if (!completedMods.includes(activeLevel)) {
          completedMods.push(activeLevel);
          localStorage.setItem('completed_modules', JSON.stringify(completedMods));
          localStorage.setItem(`lang_app_completed_modules_${uid}`, JSON.stringify(completedMods));
        }
      }
    } catch (e) {
      console.error('Failed to save local progress:', e);
    }
  }

  isLevelUnlocked(levelId: number): boolean {
    return true;
  }

  isChapterUnlocked(chapterId: number): boolean {
    return true;
  }

  isChapterCompleted(chapterId: number): boolean {
    return this.completedChapterIds().includes(chapterId);
  }

  completeChapter(chapterId: number): void {
    if (!this.completedChapterIds().includes(chapterId)) {
      this.completedChapterIds.update(ids => [...ids, chapterId]);
    }
    const level = this.selectedLevel();
    if (level) {
      const allDone = level.chapters.every(c => this.isChapterCompleted(c.id));
      if (allDone && !this.completedLevelIds().includes(level.id)) {
        this.completedLevelIds.update(lids => [...lids, level.id]);
      }
    }
    this.saveLocalProgress();

    // Call backend to sync progress and calculate rewards
    this.http.post<any>(`${environment.apiUrl}/chapters/${chapterId}/complete`, {}, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    }).subscribe({
      next: (res) => {
        if (res.rewards && res.rewards.xp_earned > 0) {
          this.rewardData.set(res.rewards);

          // Small delay before showing modal to allow confetti to start
          setTimeout(() => {
            this.showRewardModal.set(true);
            this.audioService.playSuccess(); // Optional extra jingle
          }, 800);
        }
      },
      error: (err) => console.error('Failed to sync chapter completion', err)
    });
  }

  closeRewardModal() {
    this.showRewardModal.set(false);
    this.rewardData.set(null);
  }

  goBack() {
    if (this.currentView() === 'levels') {
      this.router.navigate(['/learn/dashboard']);
    } else if (this.currentView() === 'map') {
      this.goToLevels();
    } else if (this.currentView() === 'content') {
      if (this.activeContentId() !== null) {
        this.activeContentId.set(null);
      } else {
        this.goToMap();
      }
    } else if (this.currentView() === 'activity') {
      this.currentView.set('content');
    }
  }

  selectLevel(id: number) {
    if (!this.isLevelUnlocked(id)) {
      this.triggerMascotWarning('🔒 Level is locked! Complete all chapters of the previous level to unlock.');
      return;
    }
    if (this.mapLoadTimer) { clearTimeout(this.mapLoadTimer); }
    this.isLoadingMap.set(true);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: 'map', levelId: id },
      queryParamsHandling: 'merge'
    });
    this.mapLoadTimer = setTimeout(() => {
      this.isLoadingMap.set(false);
      this.mapLoadTimer = null;
    }, 1200);
  }

  selectChapterNode(id: number) {
    if (!this.isChapterUnlocked(id)) {
      this.triggerMascotWarning('🔒 Chapter is locked! Complete preceding chapters to unlock.');
      return;
    }
    this.startLesson(id);
  }

  startLesson(chapterId: number) {

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: 'content', chapterId },
      queryParamsHandling: 'merge'
    });
  }

  triggerStreakConfetti() {
    this.audioService.playSuccess();

    // Fire confetti from the bottom center
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#ff9900', '#ff0000', '#ffff00'] // Fire/streak colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#ff9900', '#ff0000', '#ffff00']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }

  showXpFloatAnimation(xp: number) {
    const el = document.createElement('div');
    el.innerHTML = `⭐ +${xp} XP`;
    el.style.position = 'fixed';
    el.style.bottom = '20%';
    el.style.left = '50%';
    el.style.transform = 'translate(-50%, 0)';
    el.style.color = '#fbbf24';
    el.style.fontWeight = 'bold';
    el.style.fontSize = '2rem';
    el.style.textShadow = '0 4px 6px rgba(0,0,0,0.3)';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';

    document.body.appendChild(el);

    gsap.to(el, {
      y: -100,
      opacity: 0,
      duration: 1.5,
      ease: 'power2.out',
      onComplete: () => {
        el.remove();
      }
    });
  }

  // --- End Gamification Animation Functions ---

  private resolveActivityReferences(contents: Content[]): Observable<Content[]> {
    const referencePositions: Array<{ contentIdx: number, blockIdx: number, refId: number }> = [];
    const uniqueIds = new Set<number>();

    contents.forEach((content, contentIdx) => {
      if (content.text_content) {
        const trimmed = content.text_content.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed);
            const blocks = parsed.blocks || [];
            blocks.forEach((block: any, blockIdx: number) => {
              if (block.type === 'activity' && block.data && block.data.type === 'activity_reference') {
                const refId = block.data.activityReferenceId;
                if (refId) {
                  referencePositions.push({ contentIdx, blockIdx, refId });
                  uniqueIds.add(refId);
                }
              }
            });
          } catch (e) { }
        }
      }
    });

    if (uniqueIds.size === 0) {
      return of(contents);
    }

    const idsArray = Array.from(uniqueIds);
    return this.http.get<any[]>(`${environment.apiUrl}/activities`, { params: { ids: idsArray.join(',') } }).pipe(
      map(activities => {
        const activityMap = new Map<number, any>();
        activities.forEach(act => {
          activityMap.set(act.id, act);
        });

        referencePositions.forEach(pos => {
          const act = activityMap.get(pos.refId);
          if (!act) return;
          const content = contents[pos.contentIdx];
          if (!content.text_content) return;
          try {
            const parsed = JSON.parse(content.text_content);
            const block = parsed.blocks[pos.blockIdx];
            const realData = typeof act.data_json === 'string' ? JSON.parse(act.data_json) : act.data_json;

            block.data = {
              ...realData,
              type: act.type,
              title: act.title
            };
            content.text_content = JSON.stringify(parsed);
          } catch (e) { }
        });
        return contents;
      }),
      catchError(err => {
        return of(contents);
      })
    );
  }

  loadGameModeSequence(moduleId: string, gameType: string) {
    this.isLoadingLesson.set(true);
    const structure = this.courseStructure();
    if (!structure || !structure.levels || structure.levels.length === 0) {
      this.isLoadingLesson.set(false);
      return;
    }

    const level = structure.levels.find(l => l.id.toString() === moduleId || l.name === moduleId || l.id.toString() === '101');
    const targetLevel = level || structure.levels[0];
    if (!targetLevel || !targetLevel.chapters || targetLevel.chapters.length === 0) {
      this.isLoadingLesson.set(false);
      return;
    }

    const requests = targetLevel.chapters.map(chap =>
      this.http.get<any>(`${environment.apiUrl}/chapters/${chap.id}`).pipe(
        switchMap(chapterData => {
          if (!chapterData) return of(null);
          const contents = (chapterData.contents || [])
            .filter((c: any) => c.is_active !== false)
            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

          return this.resolveActivityReferences(contents).pipe(
            map(resolvedContents => ({ chapterInfo: chapterData, contents: resolvedContents }))
          );
        }),
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        let steps: any[] = [];
        let actIndex = 0;

        results.forEach(res => {
          if (res && res.contents) {
            res.contents.forEach((content: any) => {
              if (content.text_content) {
                try {
                  const parsed = JSON.parse(content.text_content);
                  if (parsed.blocks) {
                    parsed.blocks.forEach((block: any) => {
                      if (block.type === 'activity' && block.data && (block.data.type === gameType || !gameType || gameType === 'all')) {
                        let actName = (block.data.type || gameType).split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        if (block.data.type === 'mcq') actName = 'Multiple Choice';

                        steps.push({
                          type: 'activity',
                          title: block.data.title || `${actName} - ${++actIndex}`,
                          activity_id: `q_${actIndex}`,
                          data: block
                        });
                      }
                    });
                  }
                } catch (e) { }
              }
            });
          }
        });

        // Question Shuffling & Pick 10 max
        if (steps.length >= 40) {
          const basicSteps = steps.slice(0, 30);
          const specialSteps = steps.slice(30);

          const shuffledBasic = this.shuffleArray(basicSteps).slice(0, 5);
          const shuffledSpecial = this.shuffleArray(specialSteps).slice(0, 5);

          steps = this.shuffleArray([...shuffledBasic, ...shuffledSpecial]);
        } else if (steps.length > 0) {
          steps = this.shuffleArray(steps);
          if (steps.length > 10) {
            steps = steps.slice(0, 10);
          }
        }


        this.lessonSequence.set(steps);
        this.currentStepIndex.set(0);
        this.isLoadingLesson.set(false);
      },
      error: () => {
        this.isLoadingLesson.set(false);
      }
    });
  }

loadLessonSequence(chapterId: number) {
  this.lessonSequence.set([]);
  this.isLoadingLesson.set(true);
  this.currentStepIndex.set(0);
  this.isVideoCompleted.set(false);
  this.hearts.set(5);
  this.showGameOver.set(false);
  this.lessonFinished.set(false);
  this.activityFeedbackState.set(null);

  // Auto-resolve activeLevelId if not set (e.g. navigating directly via URL)
  const structure = this.courseStructure();
  if (structure && !this.activeLevelId()) {
    for (const l of structure.levels) {
      if (l.chapters.some(c => c.id === chapterId)) {
        this.activeLevelId.set(l.id);
        break;
      }
    }
  }

  // 1. Instant Load Fallback from active courseStructure in memory (0ms delay)
  if (structure) {
    for (const level of structure.levels) {
      const chap = level.chapters.find(c => c.id === chapterId);
      if (chap && chap.contents && chap.contents.length > 0) {
        this.generateLessonSequence(chap.contents, chap.assessments || [], chap);
        break;
      }
    }
  }

  // Fetch the full chapter details including contents and assessments in a single request
  this.http.get<any>(`${environment.apiUrl}/chapters/${chapterId}`).pipe(
    switchMap(chapterData => {
      const contents: Content[] = (chapterData.contents || [])
        .filter((c: any) => c.is_active !== false)
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

      return this.resolveActivityReferences(contents).pipe(
        map(resolvedContents => ({
          chapterInfo: chapterData,
          contents: resolvedContents,
          assessments: chapterData.assessments || []
        }))
      );
    })
  ).subscribe({
    next: (result) => {
      this.generateLessonSequence(result.contents, result.assessments, result.chapterInfo);
    },
    error: (err) => {
      console.warn('Failed to load chapter contents from backend, generating fallback sequence:', err);

      if (err.status === 404) {
        this.activeChapterId.set(null);
        this.loadStructure(); // Re-fetch structure which will correct the state
        return;
      }

      const fallbackContents: Content[] = [
        {
          id: chapterId,
          name: 'Tamil Grammar Concept',
          text_content: '{"blocks":[{"type":"header","data":{"text":"தமிழ் இலக்கண பாடம்"}},{"type":"paragraph","data":{"text":"அடிப்படை இலக்கண கருத்துக்களை கற்றுக்கொண்டு பயிற்சி செய்து தேர்ச்சி பெறுக!"}}]}'
        }
      ];
      this.generateLessonSequence(fallbackContents, []);
    }
  });
}

generateLessonSequence(contents: Content[], chapterAssessments: any[], chapterInfo ?: any) {
  const steps: LessonStep[] = [];

  // Step 1: Chapter Intro (Skipped to go directly to content as requested)

  contents.forEach(content => {
    // if (content.id === 1) {
    //   steps.push({
    //     type: 'video',
    //     title: 'Homophones Lesson',
    //     data: 'assets/Homophones video .mp4'
    //   });
    // }

    // if (content.external_url && content.external_url.length > 0) {
    //   steps.push({
    //     type: 'video',
    //     title: content.title || content.name,
    //     data: content.external_url[0] // Assume first URL is the video link
    //   });
    // }

    if (content.attachments && content.attachments.length > 0) {
      steps.push({
        type: 'pdf',
        title: content.title || content.name + ' - Document',
        data: content.attachments
      });
    }

    if (content.text_content) {
      let isJson = false;
      let blocks = [];
      const trimmed = content.text_content.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const data = JSON.parse(trimmed);
          blocks = data.blocks || [];
          isJson = true;
        } catch (e) { }
      }

      if (isJson) {
        const videoBlocks = blocks.filter((b: any) => b.type === 'video' || b.type === 'embed');
        const pdfBlocks = blocks.filter((b: any) => b.type === 'pdf');
        const readingBlocks = blocks.filter((b: any) => b.type !== 'activity' && b.type !== 'video' && b.type !== 'embed' && b.type !== 'practice' && b.type !== 'pdf' && b.type !== 'assessment');
        const practiceBlocks = blocks.filter((b: any) => b.type === 'practice');
        const activityBlocks = blocks.filter((b: any) => b.type === 'activity');
        const assessmentBlocks = blocks.filter((b: any) => b.type === 'assessment');

        // if (videoBlocks.length > 0) {
        //   videoBlocks.forEach((block: any, idx: number) => {
        //     steps.push({
        //       type: 'video',
        //       title: (content.title || content.name) + (videoBlocks.length > 1 ? ` - Video ${idx + 1}` : ' - Video'),
        //       data: block.data.url || block.data.embed
        //     });
        //   });
        // }

        if (pdfBlocks.length > 0) {
          pdfBlocks.forEach((block: any, idx: number) => {
            steps.push({
              type: 'pdf',
              title: (content.title || content.name) + (pdfBlocks.length > 1 ? ` - Document ${idx + 1}` : ' - Document'),
              data: block.data.url
            });
          });
        }

        if (readingBlocks.length > 0) {
          let processedReadingBlocks: any[] = [];
          for (let i = 0; i < readingBlocks.length; i++) {
            let b = readingBlocks[i];
            if ((b.type === 'paragraph' || b.type === 'text') && b.data && b.data.text && b.data.text.length > 400 && !b.data.text.includes('<table') && !b.data.text.includes('<ul') && !b.data.text.includes('<ol') && !b.data.text.includes('<div') && !b.data.text.includes('<li') && !b.data.text.includes('class=')) {
              const rawHtml = b.data.text;
              let parts = rawHtml.split(/(?<=[\.\?\!]\s+)|(?=<h[1-6]|<p|<ul|<ol|<li|<div|<br|\n)/gi);
              if (parts.length === 1 && parts[0].length > 500) {
                parts = rawHtml.split(/(?<=\s+)/g);
              }
              let currentPageHtml = '';
              for (let part of parts) {
                if (currentPageHtml.length + part.length > 500 && currentPageHtml.length > 0) {
                  processedReadingBlocks.push({ type: 'paragraph', data: { text: currentPageHtml } });
                  currentPageHtml = part;
                } else {
                  currentPageHtml += part;
                }
              }
              if (currentPageHtml.length > 0) {
                processedReadingBlocks.push({ type: 'paragraph', data: { text: currentPageHtml } });
              }
            } else {
              processedReadingBlocks.push(b);
            }
          }

          let groupedBlocks = [];
          let currentGroup = [];
          let currentGroupLength = 0;

          for (let i = 0; i < processedReadingBlocks.length; i++) {
            let b = processedReadingBlocks[i];
            let bLength = (b.data && typeof b.data.text === 'string') ? b.data.text.length : 100;

            if (currentGroupLength > 0 && currentGroupLength + bLength > 600) {
              groupedBlocks.push(currentGroup);
              currentGroup = [b];
              currentGroupLength = bLength;
            } else {
              currentGroup.push(b);
              currentGroupLength += bLength;
              if (currentGroup.length >= 3 && b.type !== 'header') {
                groupedBlocks.push(currentGroup);
                currentGroup = [];
                currentGroupLength = 0;
              }
            }
          }
          if (currentGroup.length > 0) {
            groupedBlocks.push(currentGroup);
          }

          steps.push({
            type: 'reading',
            title: content.title || content.name,
            data: { isJson: true, blocks: groupedBlocks }
          });
        }

        // Practice mode steps are now accessed directly via the Games tab
        /*
        if (practiceBlocks.length > 0) {
          practiceBlocks.forEach((block: any, idx: number) => {
            steps.push({
              type: 'practice',
              title: 'Practice Mode - ' + (block.data?.topic || 'Grammar'),
              data: block.data
            });
          });
        }
        */

        if (activityBlocks.length > 0) {
          let preparedBlocks = [];

          // Check if this is the Eluthu module (which has 50 questions)
          if (activityBlocks.length >= 40) {
            const basicBlocks = activityBlocks.slice(0, 30);
            const specialBlocks = activityBlocks.slice(30);

            const shuffledBasic = this.shuffleArray(basicBlocks).slice(0, 5);
            const shuffledSpecial = this.shuffleArray(specialBlocks).slice(0, 5);

            preparedBlocks = this.shuffleArray([...shuffledBasic, ...shuffledSpecial]);
          } else {
            preparedBlocks = this.shuffleArray(activityBlocks);
            if (preparedBlocks.length > 10) {
              preparedBlocks = preparedBlocks.slice(0, 10);
            }
          }

          preparedBlocks.forEach((block: any, idx: number) => {
            let actName = 'Unknown';
            if (block.data && block.data.type) {
              actName = block.data.type.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              if (block.data.type === 'mcq') actName = 'Multiple Choice';
            }

            steps.push({
              type: 'activity',
              title: `${idx + 1}. Activity - ${actName}`,
              activity_id: `q_${idx}`,
              data: block
            });
          });
        }

        if (assessmentBlocks.length > 0) {
          assessmentBlocks.forEach((block: any, idx: number) => {
            steps.push({
              type: 'assessment',
              title: 'Final Assessment',
              data: block
            });
          });
        }
      } else {
        const rawHtml = content.text_content || '';
        let pages = [];

        if (rawHtml.length > 400) {
          let parts = rawHtml.split(/(?<=[\.\?\!]\s+)|(?=<h[1-6]|<p|<ul|<ol|<li|<div|<br|\n)/gi);
          if (parts.length === 1 && parts[0].length > 500) {
            parts = rawHtml.split(/(?<=\s+)/g);
          }
          let currentPage = '';
          for (let part of parts) {
            if (currentPage.length + part.length > 500 && currentPage.length > 0) {
              pages.push([{ type: 'paragraph', data: { text: currentPage } }]);
              currentPage = part;
            } else {
              currentPage += part;
            }
          }
          if (currentPage.length > 0) {
            pages.push([{ type: 'paragraph', data: { text: currentPage } }]);
          }
        } else {
          pages = [[{ type: 'paragraph', data: { text: rawHtml } }]];
        }

        steps.push({
          type: 'reading',
          title: content.title || content.name,
          data: { isJson: true, blocks: pages }
        });
      }
    }

    if (content.assessments && content.assessments.length > 0) {
      steps.push({
        type: 'assessment',
        title: content.title || content.name + ' - Quiz',
        data: content.assessments
      });
    }
  });

  if (chapterAssessments.length > 0) {
    steps.push({
      type: 'assessment',
      title: 'Chapter Quiz',
      data: chapterAssessments
    });
  }

  this.lessonSequence.set(steps);
  this.evaluateStepCompletion();
  this.isLoadingLesson.set(false);
}

handleStepCompleted(isCompleted: boolean) {
  this.isStepCompleted.set(isCompleted);
}

evaluateStepCompletion() {
  const step = this.currentStep();
  if (!step) return;

  if (this.learningMode() === 'easy') {
    this.isStepCompleted.set(true); // Easy mode allows skipping anything
    return;
  }

  if (step.type === 'pdf' || step.type === 'remediation') {
    this.isStepCompleted.set(true);
  } else if (step.type === 'reading') {
    if (step.data.isJson && step.data.blocks && step.data.blocks.length > 0) {
      this.isStepCompleted.set(false); // KidsLessonPlayer emits stepCompleted
    } else {
      this.isStepCompleted.set(true);
    }
  } else if (step.type === 'video') {
    this.isStepCompleted.set(this.isVideoCompleted());
  } else if (step.type === 'practice') {
    this.isStepCompleted.set(false); // KidsLessonPlayer emits practiceCompleted
  } else {
    this.isStepCompleted.set(false);
  }
}

goToLevels() {
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { view: 'levels', levelId: null, chapterId: null },
    queryParamsHandling: 'merge'
  });
}

selectTopic(id: number): void {
  this.activeContentId.set(id);
  this.fullContent.set(null); // Reset while loading

  const url = `${environment.apiUrl}/contents/${id}`;
  this.http.get<Content>(url).subscribe({
    next: (content) => {
      this.fullContent.set(content);
      this.currentView.set('content'); // Switch to content overlay
    },
    error: (err) => console.error('Failed to load topic content:', err)
  });
}

goToMap(): void {
  this.location.back();
}

goToActivity(): void {
  this.hearts.set(5);
  this.showGameOver.set(false);
  this.currentActivityIndex.set(0);
  this.currentView.set('activity');
}



  // Track answered questions per session (to batch per activity step)
  private activitySessionCorrect = 0;
  private activitySessionTotal = 0;

onActivityAnswered(event: any) {
  if (event && event.isCorrect !== undefined) {
    this.activityFeedbackState.set(event.isCorrect ? 'correct' : 'incorrect');

    // Track stats for backend sync
    this.activitySessionTotal++;
    if (event.isCorrect) this.activitySessionCorrect++;

    if (event.isCorrect) {
      this.audioService.playSuccess();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#4ade80', '#fcd34d', '#3b82f6']
      });

      this.coins.update(c => c + 5);
      this.xp.update(x => x + 10);
      this.isStepCompleted.set(true);

      setTimeout(() => {
        gsap.fromTo('.stat-badge',
          { scale: 1.3, boxShadow: '0 0 20px #fcd34d' },
          { scale: 1, boxShadow: 'none', duration: 0.8, ease: 'elastic.out(1, 0.3)', stagger: 0.1 }
        );

        gsap.fromTo('.mascot-happy',
          { y: 50, scaleY: 0.7, rotation: -15 },
          { y: 0, scaleY: 1.1, rotation: 10, duration: 0.6, ease: 'back.out(1.7)' }
        );
        gsap.to('.mascot-happy', {
          y: -8, rotation: 0, scaleY: 1, duration: 1.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.6
        });
      }, 50);
    } else {
      this.audioService.playError();
      this.hearts.update(h => Math.max(0, h - 1));

      setTimeout(() => {
        gsap.fromTo('.mascot-sad',
          { x: -15, rotation: -20 },
          { x: 15, rotation: 20, duration: 0.1, repeat: 5, yoyo: true, ease: 'sine.inOut' }
        );
        gsap.to('.mascot-sad', { x: 0, rotation: 0, duration: 0.3, delay: 0.6 });
      }, 50);
      if (this.hearts() === 0) {
        this.showGameOver.set(true);
        this.heartRefillTimer.set(30);
        this.timerInterval = setInterval(() => {
          const currentTimer = this.heartRefillTimer();
          if (currentTimer > 0) {
            this.heartRefillTimer.set(currentTimer - 1);
          } else {
            clearInterval(this.timerInterval);
          }
        }, 1000);
      }
    }

    // Record this individual activity answer to backend (fire-and-forget)
    const token = this.authService.getToken();
    if (token) {
      this.http.post<any>(`${environment.apiUrl}/student/record-activity`, {
        activity_type: 'activity',
        mode: 'lesson',
        course_id: this.courseId() ?? null,
        content_id: this.activeChapterId() ?? null,
        activity_id: this.currentStep()?.activity_id || this.currentStepIndex().toString(),
        score: event.isCorrect ? 1 : 0,
        total: 1,
      }, { headers: { Authorization: `Bearer ${token}` } }).subscribe({
        next: (res) => {
          console.log('[record-activity] OK:', res);
          if (res.xp_earned > 0) {
            this.showXpFloatAnimation(res.xp_earned);
          }
          if (res.streak_extended) {
            this.triggerStreakConfetti();
          }
        },
        error: (err) => console.error('[record-activity] FAILED:', err.status, err.error)
      });
    } else {
      console.warn('[record-activity] No token — activity not recorded');
    }
  }
}

continueFromFeedback() {
  const state = this.activityFeedbackState();
  this.activityFeedbackState.set(null);

  if (state === 'incorrect' && this.hearts() > 0) {
    const currentStep = this.currentStep();
    if (currentStep) {
      // Clone the step and data to ensure Angular detects the reference change and resets state
      const clonedStep: LessonStep = {
        type: currentStep.type,
        title: currentStep.title + ' (Retry)',
        activity_id: currentStep.activity_id,
        data: currentStep.data ? {
          ...currentStep.data,
          data: currentStep.data.data ? { ...currentStep.data.data } : undefined
        } : undefined
      };

      const remediationStep: LessonStep = {
        type: 'remediation',
        title: 'மீண்டும் முயற்சி செய்வோம்!',
        data: {
          isJson: false,
          text: 'சில கேள்விகளுக்குத் தவறாகப் பதில் அளித்துவிட்டீர்கள்! கவலை வேண்டாம், மீண்டும் ஒருமுறை முயற்சி செய்வோம்! உங்களால் முடியும்! ✨'
        }
      };

      this.lessonSequence.update(seq => {
        const newSeq = [...seq];
        const firstAssessmentIdx = newSeq.findIndex(s => s.type === 'assessment');

        if (firstAssessmentIdx !== -1) {
          // Check if remediation warning is already injected before this assessment
          const hasRemediation = newSeq.slice(0, firstAssessmentIdx).some(s => s.title === 'மீண்டும் முயற்சி செய்வோம்!');
          if (!hasRemediation) {
            newSeq.splice(firstAssessmentIdx, 0, remediationStep, clonedStep);
          } else {
            newSeq.splice(firstAssessmentIdx, 0, clonedStep);
          }
        } else {
          // No assessment, append to end
          const hasRemediation = newSeq.some(s => s.title === 'மீண்டும் முயற்சி செய்வோம்!');
          if (!hasRemediation) {
            newSeq.push(remediationStep, clonedStep);
          } else {
            newSeq.push(clonedStep);
          }
        }
        return newSeq;
      });
    }
  }

  if (this.hearts() > 0) {
    this.nextLessonStep();
  }
}

retryActivity() {
  if (this.heartRefillTimer() > 0) return; // Prevent early click
  this.hearts.set(5);
  this.showGameOver.set(false);
  this.activityFeedbackState.set(null);
  this.evaluateStepCompletion();
}



nextLessonStep() {
  const currentIdx = this.currentStepIndex();
  if (currentIdx < this.lessonSequence().length - 1) {
    this.currentStepIndex.set(currentIdx + 1);
    this.isVideoCompleted.set(false);
    this.evaluateStepCompletion();
    this.activityFeedbackState.set(null);
  } else {
    this.lessonFinished.set(true);
  }
}

prevLessonStep() {
  const currentIdx = this.currentStepIndex();
  if (currentIdx > 0) {
    this.currentStepIndex.set(currentIdx - 1);
    this.evaluateStepCompletion();
    this.lessonFinished.set(false);
    this.activityFeedbackState.set(null);
  }
}

logout() {
  this.authService.logout().subscribe({
    complete: () => {
      window.location.href = '/login';
    },
    error: () => {
      this.authService.clearSession();
      window.location.href = '/login';
    }
  });
}


ngOnDestroy() {
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
  }
}

finishLesson() {
  this.audioService.playSuccess();

  const duration = 2.5 * 1000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#4ade80', '#fcd34d', '#3b82f6', '#ec4899', '#8b5cf6']
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#4ade80', '#fcd34d', '#3b82f6', '#ec4899', '#8b5cf6']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();

  const activeChapId = this.activeChapterId();
  if (activeChapId) {
    this.completeChapter(activeChapId);
  }

  setTimeout(() => {
    this.goToMap();
  }, 2000);
}

completeActiveChapterAndGoToMap() {
  const activeChapId = this.activeChapterId();
  if (activeChapId) {
    this.completeChapter(activeChapId);
  }
  this.goToMap();
}

nextActivityPage(): void {
  this.currentActivityIndex.update(v => v + 1);
}

prevActivityPage(): void {
  this.currentActivityIndex.update(v => Math.max(0, v - 1));
}

toggleLevel(level: Level): void {
  level.is_expanded = !level.is_expanded;
}

toggleChapter(chapter: Chapter): void {
  chapter.is_expanded = !chapter.is_expanded;
}

toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      this.isFullscreen.set(true);
    }).catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        this.isFullscreen.set(false);
      });
    }
  }
}

  private shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
}