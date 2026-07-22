import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

import { AuthService } from '../../services/auth';

export interface LearningModule {
  id: string;
  titleTa: string;
  titleEn: string;
  status: 'completed' | 'in-progress' | 'locked';
  progress: number;
  description: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  introTextTa: string;
  introTextEn: string;
  lessonTitle: string;
  lessonSubtitle: string;
  assessmentQuestions: number;
  assessmentMinutes: number;
  assessmentPassingScore: number;
  chapters?: any[];
}

@Component({
  selector: 'app-learn-modules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learn-modules.html',
  styleUrls: ['./learn-modules.css']
})
export class LearnModulesComponent implements OnInit {
  protected http = inject(HttpClient);
  protected router = inject(Router);
  protected authService = inject(AuthService);

  activeModule = signal<LearningModule | null>(null);
  currentFlowStep = signal<number>(1); // 1: Intro, 2: Lessons, 3: Games, 4: Assessment, 5: Result
  backendChapters = signal<any[]>([]);
  isLoadingChapters = signal<boolean>(true);
  learningMode = signal<'freestyle' | 'strict'>('strict');

  // Accordion & Stats Signals for Image 1 Layout
  expandedModuleId = signal<string | null>(null);
  doneCount = signal<number>(0);
  leftCount = signal<number>(0);

  modules = signal<LearningModule[]>([]);

  ngOnInit(): void {
    this.loadUserProgressFromStorage();
    this.loadFromCacheThenFetch();
  }

  // ===== CACHE-FIRST LOADING: Show instantly from cache, refresh in background =====
  loadFromCacheThenFetch(): void {
    const cachedRaw = localStorage.getItem('lang_app_course_structure');
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (cached.levels && cached.levels.length > 0) {
          // Render instantly from cache (no loader)
          this.syncModulesWithBackendStructure(cached.levels, cached);
          // Then refresh in background silently
          this.fetchBackendChapters(true);
          return;
        }
      } catch (e) {}
    }
    // No cache → show loader and fetch
    this.fetchBackendChapters(false);
  }

  setMode(mode: 'freestyle' | 'strict'): void {
    this.learningMode.set(mode);
    localStorage.setItem('course_learning_mode', mode);
    this.fetchBackendChapters();
  }

  toggleModuleAccordion(moduleId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const current = this.expandedModuleId();
    const next = current === moduleId ? null : moduleId;
    this.expandedModuleId.set(next);
    // Persist last open module so returning from lesson restores it
    if (next) {
      localStorage.setItem('lang_app_last_expanded_module', next);
      this.prefetchModuleChapters(next);
    }
  }

  prefetchModuleChapters(moduleId: string): void {
    const targetMod = this.modules().find(m => m.id === moduleId);
    if (!targetMod || !targetMod.chapters) return;

    targetMod.chapters.forEach((chap: any) => {
      const chapterId = chap.id;
      const cacheKey = `lang_app_resolved_chapter_${chapterId}`;
      
      // Fetch silently if not already cached
      if (!localStorage.getItem(cacheKey)) {
        this.http.get<any>(`${environment.apiUrl}/chapters/${chapterId}`).subscribe({
          next: (chapterData) => {
            const contents: any[] = (chapterData.contents || [])
              .filter((c: any) => c.is_active !== false)
              .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

            const uniqueIds = new Set<number>();
            const referencePositions: Array<{ contentIdx: number; blockIdx: number; refId: number }> = [];

            contents.forEach((content, contentIdx) => {
              if (!content.text_content) return;
              try {
                const parsed = JSON.parse(content.text_content);
                if (parsed.blocks && Array.isArray(parsed.blocks)) {
                  parsed.blocks.forEach((block: any, blockIdx: number) => {
                    if (block.type === 'activity' && block.data && block.data.activityId) {
                      const refId = +block.data.activityId;
                      uniqueIds.add(refId);
                      referencePositions.push({ contentIdx, blockIdx, refId });
                    }
                  });
                }
              } catch (e) {}
            });

            if (uniqueIds.size === 0) {
              const result = {
                chapterInfo: chapterData,
                contents: contents,
                assessments: chapterData.assessments || []
              };
              localStorage.setItem(cacheKey, JSON.stringify(result));
              return;
            }

            const idsArray = Array.from(uniqueIds);
            this.http.get<any[]>(`${environment.apiUrl}/activities`, { params: { ids: idsArray.join(',') } }).subscribe({
              next: (activities) => {
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
                  } catch (e) {}
                });

                const result = {
                  chapterInfo: chapterData,
                  contents: contents,
                  assessments: chapterData.assessments || []
                };
                localStorage.setItem(cacheKey, JSON.stringify(result));
              },
              error: () => {}
            });
          },
          error: () => {}
        });
      }
    });
  }

  loadUserProgressFromStorage(): void {
    const userId = this.authService.getUser()?.id || 1;
    const legacyChaptersRaw = localStorage.getItem('completed_chapters');
    const scopedChaptersRaw = localStorage.getItem(`lang_app_completed_chapters_${userId}_1`);
    const legacyIds: number[] = legacyChaptersRaw ? JSON.parse(legacyChaptersRaw) : [];
    const scopedIds: number[] = scopedChaptersRaw ? JSON.parse(scopedChaptersRaw) : [];
    const completedChapterIds = Array.from(new Set([...legacyIds, ...scopedIds]));

    const currentModules = this.modules();
    if (currentModules.length > 0) {
      let totalChapCount = 0;
      let completedCountTotal = 0;

      currentModules.forEach(mod => {
        (mod.chapters || []).forEach(chap => {
          totalChapCount++;
          if (completedChapterIds.includes(chap.id)) {
            completedCountTotal++;
          }
        });
      });

      this.doneCount.set(completedCountTotal);
      this.leftCount.set(Math.max(0, totalChapCount - completedCountTotal));
    }
  }

  markModuleComplete(moduleId: string): void {
    const userId = this.authService.getUser()?.id || 1;
    localStorage.setItem(`${moduleId}_completed`, 'true');

    const completedModsRaw = localStorage.getItem('completed_modules');
    const completedMods: string[] = completedModsRaw ? JSON.parse(completedModsRaw) : [];
    if (!completedMods.includes(moduleId)) {
      completedMods.push(moduleId);
      localStorage.setItem('completed_modules', JSON.stringify(completedMods));
      localStorage.setItem(`lang_app_completed_modules_${userId}`, JSON.stringify(completedMods));
    }

    this.loadUserProgressFromStorage();
  }

  fetchBackendChapters(silent: boolean = false): void {
    if (!silent) this.isLoadingChapters.set(true);

    this.http.get<any[]>(`${environment.apiUrl}/courses`).subscribe({
      next: (courses) => {
        if (courses && courses.length > 0) {
          const targetCourseId = courses[0].id;
          const courseMode = (courses[0].mode || courses[0].learning_mode || '').toLowerCase();
          const savedMode = localStorage.getItem('course_learning_mode');
          if (savedMode === 'freestyle' || savedMode === 'strict') {
            this.learningMode.set(savedMode);
          } else if (courseMode.includes('free') || courseMode.includes('open')) {
            this.learningMode.set('freestyle');
          }

          this.http.get<any>(`${environment.apiUrl}/courses/${targetCourseId}/player-structure`).subscribe({
            next: (structure) => {
              if (structure && structure.levels && structure.levels.length > 0) {
                // Cache the fresh structure for next time
                localStorage.setItem('lang_app_course_structure', JSON.stringify(structure));
                this.syncModulesWithBackendStructure(structure.levels, structure);
              } else {
                if (!silent) this.useDefaultModulesFallback();
              }
            },
            error: () => { if (!silent) this.useDefaultModulesFallback(); }
          });
        } else {
          if (!silent) this.useDefaultModulesFallback();
        }
      },
      error: () => { if (!silent) this.useDefaultModulesFallback(); }
    });
  }

  fallbackFetchChapters(): void {
    this.http.get<any[]>(`${environment.apiUrl}/chapters`).subscribe({
      next: (data) => {
        this.backendChapters.set(data || []);
        this.useDefaultModulesFallback();
      },
      error: (err) => {
        console.warn('Failed to load real chapters from API, fallback to default:', err);
        this.useDefaultModulesFallback();
      }
    });
  }

  syncModulesWithBackendStructure(levels: any[], rawStructure?: any): void {
    if (!levels || levels.length === 0) {
      this.useDefaultModulesFallback();
      return;
    }

    const savedMode = localStorage.getItem('course_learning_mode');
    if (savedMode === 'freestyle' || savedMode === 'strict') {
      this.learningMode.set(savedMode);
    } else if (rawStructure) {
      const modeStr = (rawStructure.mode || rawStructure.learning_mode || rawStructure.type || '').toLowerCase();
      if (modeStr.includes('free') || modeStr.includes('open')) {
        this.learningMode.set('freestyle');
      }
    }

    const isFreestyle = this.learningMode() === 'freestyle';
    const bgColors = ['#00B894', '#E67E22', '#6C5CE7', '#FD79A8', '#00CEC9', '#0984E3'];

    let isPrevLevelDone = true;

    const dynamicModules: LearningModule[] = levels.map((lvl: any, index: number) => {
      const levelId = lvl.id ? lvl.id.toString() : `level_${index + 1}`;
      const levelChapters = (lvl.chapters || []).map((c: any) => ({
        id: c.id,
        name: c.name || c.title || 'பாட அத்தியாயம்',
        description: c.description || c.code || ''
      }));

      const isCompleted = levelChapters.length > 0 && levelChapters.every((c: any) => this.isChapterCompleted(c.id));
      const isAnyDone = levelChapters.some((c: any) => this.isChapterCompleted(c.id));

      let status: 'completed' | 'in-progress' | 'locked' = 'locked';

      if (isFreestyle) {
        // Freestyle mode: ALL modules unlocked!
        status = isCompleted ? 'completed' : 'in-progress';
      } else {
        // Strict mode: Step-by-step unlock
        if (isCompleted) {
          status = 'completed';
          isPrevLevelDone = true;
        } else if (index === 0 || isPrevLevelDone || isAnyDone) {
          status = 'in-progress';
          isPrevLevelDone = false;
        } else {
          status = 'locked';
          isPrevLevelDone = false;
        }
      }

      return {
        id: levelId,
        titleTa: lvl.name || `நிலை ${index + 1}`,
        titleEn: lvl.code || lvl.slug || `Level ${index + 1}`,
        status: status,
        progress: isCompleted ? 100 : (isAnyDone ? 50 : 0),
        description: lvl.description || `${lvl.name || 'பாட நிலை'} பற்றிய பாடங்கள்`,
        icon: status === 'completed' ? 'bi-check-circle-fill' : (status === 'in-progress' ? 'bi-play-circle-fill' : 'bi-lock-fill'),
        badgeBg: bgColors[index % bgColors.length],
        badgeText: status === 'completed' ? 'Completed' : (status === 'in-progress' ? 'In Progress' : 'Locked'),
        introTextTa: lvl.description || '',
        introTextEn: '',
        lessonTitle: lvl.name || `Level ${index + 1}`,
        lessonSubtitle: `${levelChapters.length} chapters`,
        assessmentQuestions: 10,
        assessmentMinutes: 10,
        assessmentPassingScore: 70,
        chapters: levelChapters
      };
    });

    let totalChaps = 0;
    let doneChaps = 0;
    dynamicModules.forEach(m => {
      (m.chapters || []).forEach(c => {
        totalChaps++;
        if (this.isChapterCompleted(c.id)) {
          doneChaps++;
        }
      });
    });

    this.doneCount.set(doneChaps);
    this.leftCount.set(Math.max(0, totalChaps - doneChaps));

    this.modules.set(dynamicModules);

    // Prefetch all unlocked modules' chapters silently in the background
    dynamicModules.forEach(mod => {
      if (mod.status !== 'locked') {
        this.prefetchModuleChapters(mod.id);
      }
    });

    // Restore last open module; if none saved, auto-expand the first in-progress module
    const savedExpanded = localStorage.getItem('lang_app_last_expanded_module');
    if (savedExpanded && dynamicModules.find(m => m.id === savedExpanded)) {
      this.expandedModuleId.set(savedExpanded);
    } else {
      const inProgress = dynamicModules.find(m => m.status === 'in-progress');
      const autoExpand = inProgress ? inProgress.id : (dynamicModules[0]?.id || null);
      this.expandedModuleId.set(autoExpand);
    }

    this.isLoadingChapters.set(false);
  }

  isChapterUnlocked(module: LearningModule, chapterIndex: number): boolean {
    if (this.learningMode() === 'freestyle') {
      return true; // ALL unlocked in Freestyle Mode
    }

    if (module.status === 'locked') {
      return false; // Locked level
    }

    if (chapterIndex === 0) {
      return true; // First chapter of unlocked level is open
    }

    const chapters = module.chapters || [];
    const prevChap = chapters[chapterIndex - 1];
    if (!prevChap) return true;

    return this.isChapterCompleted(prevChap.id);
  }

  useDefaultModulesFallback(): void {
    const bgColors = ['#00B894', '#E67E22', '#6C5CE7', '#FD79A8', '#00CEC9'];
    const defaultMods: LearningModule[] = [
      {
        id: 'ezhuthu',
        titleTa: 'எழுத்து',
        titleEn: 'Letters',
        status: 'in-progress',
        progress: 50,
        description: 'Learn Tamil vowels, consonants & special letters',
        icon: 'bi-play-circle-fill',
        badgeBg: '#00B894',
        badgeText: 'In Progress',
        introTextTa: 'தமிழ் எழுத்துக்கள் பற்றிய அடிப்படை பாடங்கள்.',
        introTextEn: 'Basic lessons about Tamil letters.',
        lessonTitle: 'அடிப்படை எழுத்துக்கள்',
        lessonSubtitle: '2 chapters',
        assessmentQuestions: 10,
        assessmentMinutes: 10,
        assessmentPassingScore: 70,
        chapters: [
          { id: 1, name: 'அத்தியாயம் 1: அடிப்படை எழுத்துக்கள்', description: 'அடிப்படை எழுத்துக்கள் பற்றி அறிவோம்' },
          { id: 2, name: 'அத்தியாயம் 2: சிறப்பு எழுத்துக்கள்', description: 'சிறப்பு எழுத்துக்கள் பற்றி அறிவோம்' }
        ]
      }
    ];
    this.modules.set(defaultMods);
    this.expandedModuleId.set('ezhuthu');
    this.isLoadingChapters.set(false);
  }

  getModuleChapters(module: LearningModule): any[] {
    return module.chapters || [];
  }

  isChapterCompleted(chapId: number): boolean {
    const userId = this.authService.getUser()?.id || 1;
    const legacyChaptersRaw = localStorage.getItem('completed_chapters');
    const scopedChaptersRaw = localStorage.getItem(`lang_app_completed_chapters_${userId}_1`);
    const legacyIds: number[] = legacyChaptersRaw ? JSON.parse(legacyChaptersRaw) : [];
    const scopedIds: number[] = scopedChaptersRaw ? JSON.parse(scopedChaptersRaw) : [];
    const set = new Set([...legacyIds, ...scopedIds]);
    return set.has(chapId);
  }

  openModule(module: LearningModule) {
    if (module.status !== 'locked') {
      this.activeModule.set(module);
      this.currentFlowStep.set(2); // Jump directly to Step 2 (Lessons & Chapter Roadmap)
    }
  }

  closeModuleDetail() {
    this.activeModule.set(null);
  }

  setStep(stepNum: number) {
    this.currentFlowStep.set(stepNum);
  }

  getFilteredChapters(): any[] {
    const mod = this.activeModule();
    if (!mod) return [];
    if (mod.chapters && mod.chapters.length > 0) {
      return mod.chapters;
    }
    return [];
  }

  startLesson(chapterId?: number, isUnlocked: boolean = true) {
    if (!isUnlocked) {
      alert('முந்தைய அத்தியாயத்தை முடித்த பின்னரே இந்த அத்தியாயம் திறக்கப்படும்! 🔒');
      return;
    }

    // Save the current module + chapter so returning restores correct position
    const mod = this.activeModule();
    if (mod) {
      localStorage.setItem('lang_app_last_expanded_module', mod.id.toString());
    }
    if (chapterId) {
      localStorage.setItem('lang_app_last_chapter_id', chapterId.toString());
    }

    if (chapterId) {
      this.router.navigate(['/learn/play/1'], { queryParams: { chapterId: chapterId, view: 'content' } });
    } else {
      const filtered = this.getFilteredChapters();
      const firstChap = filtered.length > 0 ? filtered[0].id : null;
      if (firstChap) {
        localStorage.setItem('lang_app_last_chapter_id', firstChap.toString());
        this.router.navigate(['/learn/play/1'], { queryParams: { chapterId: firstChap, view: 'content' } });
      } else {
        this.router.navigate(['/learn/play/1']);
      }
    }
  }

  launchGame(modeKey: string) {
    const mod = this.activeModule();
    this.router.navigate(['/learn/practice'], {
      queryParams: {
        mode: modeKey,
        module: mod ? mod.id : 'ezhuthu'
      }
    });
  }

  startAssessment() {
    this.router.navigate(['/assessments/play/1']);
  }

  getChapterStarCount(chapId: number, idx: number): number {
    const userId = this.authService.getUser()?.id || 1;
    const legacyChaptersRaw = localStorage.getItem('completed_chapters');
    const scopedChaptersRaw = localStorage.getItem(`lang_app_completed_chapters_${userId}_1`);
    const legacyIds: number[] = legacyChaptersRaw ? JSON.parse(legacyChaptersRaw) : [];
    const scopedIds: number[] = scopedChaptersRaw ? JSON.parse(scopedChaptersRaw) : [];
    const allCompleted = new Set([...legacyIds, ...scopedIds]);

    if (allCompleted.has(chapId)) {
      return 3;
    }
    const mod = this.activeModule();
    if (mod && (mod.id === 'ezhuthu' || mod.id === 'asai') && idx === 0) {
      return 2;
    }
    return 0;
  }
}
