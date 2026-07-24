import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
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
  selector: 'app-learn-modules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learn-modules.html',
  styleUrls: ['./learn-modules.css']
})
export class LearnModulesComponent implements OnInit {
  protected http = inject(HttpClient);
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected authService = inject(AuthService);

  activeModule = signal<LearningModule | null>(null);
  currentFlowStep = signal<number>(1); // 1: Intro, 2: Lessons, 3: Games, 4: Assessment, 5: Result
  backendChapters = signal<any[]>([]);
  isLoadingChapters = signal<boolean>(true);
  learningMode = signal<'freestyle' | 'strict'>('strict');

  // Accordion & Stats Signals for Image 1 Layout
  expandedModuleId = signal<string | null>(null);
  expandedCategoryId = signal<string | null>(null);
  selectedTabForModule = signal<'lesson' | 'game' | null>(null);
  chapterCacheUpdated = signal<number>(0);
  doneCount = signal<number>(0);
  leftCount = signal<number>(0);

  modules = signal<LearningModule[]>([]);
  dynamicModules = signal<DynamicModuleItem[]>([]);
  availableCourses = signal<any[]>([]);
  viewState = signal<'courses' | 'modules' | 'category-details'>('courses');
  selectedModuleForDetails = signal<any | null>(null);

  pendingModuleId: string | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['view'] === 'category-details') {
        this.viewState.set('category-details');
        if (params['moduleId']) {
          this.pendingModuleId = params['moduleId'];
          this.resolvePendingModule();
        }
        if (params['tab']) {
          this.selectedTabForModule.set(params['tab'] as 'lesson' | 'game');
        } else {
          this.selectedTabForModule.set(null);
        }
      } else if (params['view'] === 'modules') {
        this.viewState.set('modules');
      } else {
        this.viewState.set('courses');
      }
    });

    this.loadUserProgressFromStorage();
    // Load cached courses instantly
    const cachedCourses = localStorage.getItem('lang_app_courses_list');
    if (cachedCourses) {
      try {
        const parsed = JSON.parse(cachedCourses);
        if (parsed && parsed.length > 0) {
          this.availableCourses.set(parsed);
        }
      } catch (e) {}
    }
    // Clear old generic cache to avoid stale data conflicts
    localStorage.removeItem('lang_app_course_structure');

    // Load modules only if we have a cached structure (for speed)
    this.loadFromCacheThenFetch();
  }

  getCategoryBg(id: string): string {
    const bgs = ['#FEF3C7', '#E0F2FE', '#DCFCE7', '#FCE7F3', '#F3E8FF', '#FFEDD5', '#E0E7FF'];
    const hash = id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    return bgs[Math.abs(hash) % bgs.length];
  }

  // Returns first Tamil/English letter of the module name or id as icon
  getCategoryIcon(id: string, title?: string): string {
    const src = title || id || '';
    return src.trim().charAt(0).toUpperCase() || '•';
  }

  // Returns text color matching the background
  getLetterIconColor(id: string): string {
    const colors = ['#B45309', '#0369A1', '#15803D', '#BE185D', '#6D28D9', '#C2410C', '#4338CA'];
    const hash = id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  openCourse(course: any) {
    // Save selected course id to restore later
    localStorage.setItem('lang_app_last_course_id', course.id.toString());
    this.router.navigate([], { relativeTo: this.route, queryParams: { view: 'modules' }, queryParamsHandling: 'merge' });
    // Fetch fresh structure for this course
    this.fetchCourseModules(course.id);
  }
  
  goBackToCourses() {
    this.router.navigate([], { relativeTo: this.route, queryParams: { view: null }, queryParamsHandling: 'merge' });
  }

  goBackToHome() {
    this.router.navigate(['/tabs/home']);
  }

  openCategoryModule(mod: any) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { view: 'category-details', moduleId: mod.id }, queryParamsHandling: 'merge' });
    this.selectedModuleForDetails.set(mod);
    this.selectedTabForModule.set(null);
    localStorage.setItem('lang_app_last_expanded_module', mod.id);
    
    if (!this.backendChapters().some(c => c.moduleId === mod.id)) {
      this.prefetchModuleChapters(mod.id);
    }
  }

  goBackToModules() {
    this.router.navigate([], { relativeTo: this.route, queryParams: { view: 'modules', moduleId: null }, queryParamsHandling: 'merge' });
    this.selectedModuleForDetails.set(null);
  }

  private resolvePendingModule() {
    if (this.pendingModuleId && this.modules().length > 0) {
      const mod = this.modules().find(m => m.id.toString() === this.pendingModuleId!.toString());
      if (mod) {
        this.selectedModuleForDetails.set(mod);
        this.pendingModuleId = null;
        if (!this.backendChapters().some(c => c.moduleId === mod.id)) {
          this.prefetchModuleChapters(mod.id);
        }
      } else {
        // Fallback: If module not found in the current course's modules, go back to modules list
        this.goBackToModules();
      }
    }
  }

  selectTab(tab: 'lesson' | 'game') {
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, queryParamsHandling: 'merge' });
    this.selectedTabForModule.set(tab);
  }

  clearTab(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab: null }, queryParamsHandling: 'merge' });
    this.selectedTabForModule.set(null);
  }

  getCategoryChapters(categoryId: string): any[] {
    const mod = this.modules().find(m => m.id === categoryId);
    if (mod && mod.chapters && mod.chapters.length > 0) {
      return mod.chapters;
    }
    // Return dummy chapters if backend didn't provide any
    return [
      { id: 1, name: 'அத்தியாயம் 1: அறிமுகம்', description: 'அடிப்படை பற்றி அறிவோம்' },
      { id: 2, name: 'அத்தியாயம் 2: பயிற்சி', description: 'தொடர் பயிற்சி' }
    ];
  }

  startCategoryLesson(chap: any) {
    if (chap && chap.id) {
      localStorage.setItem('lang_app_last_chapter_id', chap.id.toString());
      let currentCourseId = localStorage.getItem('lang_app_last_course_id');
      if (!currentCourseId && this.availableCourses().length > 0) {
        currentCourseId = this.availableCourses()[0].id.toString();
      }
      const courseIdToUse = currentCourseId || 1;
      this.router.navigate([`/learn/play/${courseIdToUse}`], { queryParams: { chapterId: chap.id, view: 'content' } });
    }
  }

  getCategoryActivities(categoryId: string): any[] {
    this.chapterCacheUpdated(); // Create dependency to trigger re-evaluation
    const mod = this.modules().find(m => m.id === categoryId);
    if (!mod || !mod.chapters) return [];
    
    const activities: any[] = [];
    mod.chapters.forEach(chap => {
      const cacheKey = `lang_app_resolved_chapter_${chap.id}`;
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          if (cached.contents) {
            cached.contents.forEach((content: any) => {
              if (content.text_content) {
                const parsed = JSON.parse(content.text_content);
                if (parsed.blocks) {
                  parsed.blocks.forEach((block: any, idx: number) => {
                    if (block.type === 'activity' && block.data) {
                      const actId = block.data.activityId || block.data.activityReferenceId || block.id || `act_${chap.id}_${idx}`;
                      
                      if (!activities.find(a => a.id === actId)) {
                         let title = block.data.title || block.data.question;
                         if (!title) {
                            switch(block.data.type) {
                               case 'mcq': title = 'சரியான விடையைத் தேர்ந்தெடு'; break;
                               case 'word_hunt': title = 'வார்த்தை தேடல்'; break;
                               case 'letter_basket': title = 'எழுத்து கூடை'; break;
                               case 'balloon_pop': title = 'பலூன் விளையாட்டு'; break;
                               case 'word_builder': title = 'வார்த்தை உருவாக்கு'; break;
                               case 'match': title = 'பொருத்துக'; break;
                               case 'fill_blanks': title = 'கோடிட்ட இடத்தை நிரப்புக'; break;
                               case 'true_false': title = 'சரி அல்லது தவறு'; break;
                               default: title = 'பயிற்சி விளையாட்டு'; break;
                            }
                         }

                         activities.push({
                           id: actId,
                           title: title,
                           type: block.data.type || 'activity',
                           data: block.data,
                           chapterId: chap.id
                         });
                      }
                    }
                  });
                }
              }
            });
          }
        } catch(e) {}
      }
    });
    return activities;
  }

  getGroupedCategoryActivities(categoryId: string) {
     const activities = this.getCategoryActivities(categoryId);
     const groupsMap = new Map<string, { type: string, typeLabel: string, icon: string, color: string, activities: any[] }>();
     
     activities.forEach(act => {
        let label = 'பயிற்சி';
        let icon = 'bi-controller';
        let color = '#F59E0B'; // default warning/orange
        
        switch(act.type) {
           case 'mcq': label = 'சரியான விடையைத் தேர்ந்தெடு'; icon = 'bi-ui-radios'; color = '#3B82F6'; break; // blue
           case 'word_hunt': label = 'வார்த்தை தேடல்'; icon = 'bi-search'; color = '#10B981'; break; // emerald
           case 'letter_basket': label = 'எழுத்து கூடை'; icon = 'bi-basket2-fill'; color = '#8B5CF6'; break; // purple
           case 'balloon_pop': label = 'பலூன் விளையாட்டு'; icon = 'bi-balloon-fill'; color = '#EC4899'; break; // pink
           case 'word_builder': label = 'வார்த்தை உருவாக்கு'; icon = 'bi-puzzle-fill'; color = '#F59E0B'; break; // amber
           case 'match': label = 'பொருத்துக'; icon = 'bi-arrow-left-right'; color = '#6366F1'; break; // indigo
           case 'fill_blanks': label = 'கோடிட்ட இடத்தை நிரப்புக'; icon = 'bi-input-cursor-text'; color = '#14B8A6'; break; // teal
           case 'true_false': label = 'சரி அல்லது தவறு'; icon = 'bi-check-circle-fill'; color = '#F43F5E'; break; // rose
        }

        if (!groupsMap.has(act.type)) {
           groupsMap.set(act.type, { type: act.type, typeLabel: label, icon, color, activities: [] });
        }
        groupsMap.get(act.type)!.activities.push(act);
     });

     return Array.from(groupsMap.values());
  }

  playGameGroup(moduleId: string, gameType: string) {
    const courseId = localStorage.getItem('lang_app_last_course_id') || '2';
    this.router.navigate([`/learn/play/${courseId}`], { 
      queryParams: { 
        view: 'game-mode', 
        moduleId: moduleId, 
        gameType: gameType 
      } 
    });
  }

  // ===== CACHE-FIRST LOADING: Show instantly from cache, refresh in background =====
  loadFromCacheThenFetch(): void {
    let currentCourseId = localStorage.getItem('lang_app_last_course_id');
    if (!currentCourseId && this.availableCourses().length > 0) {
      currentCourseId = this.availableCourses()[0].id.toString();
    }
    const targetCourseId = currentCourseId || '1';
    const cacheKey = `lang_app_course_structure_${targetCourseId}`;
    localStorage.removeItem('lang_app_course_structure'); // Clean up old generic cache
    const cachedRaw = localStorage.getItem(cacheKey);

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
    }
  }

  prefetchModuleChapters(moduleId: string): void {
    // Disabled: Chapters are fetched on-demand when the user opens a chapter in the player.
    return;
  }

  loadUserProgressFromStorage(): void {
    const userId = this.authService.getUser()?.id || 1;
    const legacyChaptersRaw = localStorage.getItem('completed_chapters');
    const scopedChaptersRaw = localStorage.getItem(`lang_app_completed_chapters_${userId}_1`);
    const legacyIds: number[] = legacyChaptersRaw ? JSON.parse(legacyChaptersRaw!) : [];
    const scopedIds: number[] = scopedChaptersRaw ? JSON.parse(scopedChaptersRaw!) : [];
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
          this.availableCourses.set(courses);
          // Cache courses list for instant display next time
          localStorage.setItem('lang_app_courses_list', JSON.stringify(courses));
          const savedCourseId = localStorage.getItem('lang_app_last_course_id');
          const targetCourse = savedCourseId ? courses.find((c: any) => c.id.toString() === savedCourseId) : null;
          const targetCourseId = (targetCourse || courses[0]).id;
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
                localStorage.setItem(`lang_app_course_structure_${targetCourseId}`, JSON.stringify(structure));
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

  fetchCourseModules(courseId: any): void {
    const cacheKey = `lang_app_course_structure_${courseId}`;
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (cached.levels && cached.levels.length > 0) {
          this.syncModulesWithBackendStructure(cached.levels, cached);
          // Refresh silently in background
          this.http.get<any>(`${environment.apiUrl}/courses/${courseId}/player-structure`).subscribe({
            next: (structure) => {
              if (structure && structure.levels && structure.levels.length > 0) {
                localStorage.setItem(cacheKey, JSON.stringify(structure));
                this.syncModulesWithBackendStructure(structure.levels, structure);
              }
            },
            error: () => {}
          });
          return;
        }
      } catch (e) {}
    }
    // No cache - show loader
    this.isLoadingChapters.set(true);
    this.http.get<any>(`${environment.apiUrl}/courses/${courseId}/player-structure`).subscribe({
      next: (structure) => {
        if (structure && structure.levels && structure.levels.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify(structure));
          this.syncModulesWithBackendStructure(structure.levels, structure);
        } else {
          this.useDefaultModulesFallback();
        }
      },
      error: () => { this.useDefaultModulesFallback(); }
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

    if (rawStructure && (rawStructure.mode || rawStructure.learning_mode || rawStructure.type)) {
      const modeStr = (rawStructure.mode || rawStructure.learning_mode || rawStructure.type || '').toLowerCase();
      if (modeStr.includes('free') || modeStr.includes('open')) {
        this.learningMode.set('freestyle');
      } else {
        this.learningMode.set('strict');
      }
    } else {
      const savedMode = localStorage.getItem('course_learning_mode');
      if (savedMode === 'freestyle' || savedMode === 'strict') {
        this.learningMode.set(savedMode);
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
    this.resolvePendingModule();

    // Lazy loading enabled: Chapters are fetched on-demand when the user opens a chapter in the player.
    // This makes module load instant without firing 15+ background requests.

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
        id: 'level_1',
        titleTa: 'பாடப் பிரிவு 1',
        titleEn: 'Level 1',
        status: 'in-progress',
        progress: 50,
        description: 'பாடங்கள் மற்றும் பயிற்சிகள்',
        icon: 'bi-play-circle-fill',
        badgeBg: '#00B894',
        badgeText: 'In Progress',
        introTextTa: 'பாடப்பிரிவு பற்றிய அடிப்படை பாடங்கள்.',
        introTextEn: 'Basic lessons.',
        lessonTitle: 'அடிப்படை பாடங்கள்',
        lessonSubtitle: '2 chapters',
        assessmentQuestions: 10,
        assessmentMinutes: 10,
        assessmentPassingScore: 70,
        chapters: [
          { id: 1, name: 'அத்தியாயம் 1: அறிமுகம்', description: 'அடிப்படை பற்றி அறிவோம்' },
          { id: 2, name: 'அத்தியாயம் 2: பயிற்சி', description: 'தொடர் பயிற்சி' }
        ]
      }
    ];
    this.modules.set(defaultMods);
    this.resolvePendingModule();
    this.isLoadingChapters.set(false);
  }

  getModuleChapters(module: LearningModule): any[] {
    return module.chapters || [];
  }

  isChapterCompleted(chapId: number): boolean {
    const userId = this.authService.getUser()?.id || 1;
    const legacyChaptersRaw = localStorage.getItem('completed_chapters');
    const scopedChaptersRaw = localStorage.getItem(`lang_app_completed_chapters_${userId}_1`);
    const legacyIds: number[] = legacyChaptersRaw ? JSON.parse(legacyChaptersRaw!) : [];
    const scopedIds: number[] = scopedChaptersRaw ? JSON.parse(scopedChaptersRaw!) : [];
    const set = new Set([...legacyIds, ...scopedIds]);
    return set.has(chapId);
  }

  isModuleCompleted(moduleId: string): boolean {
    const chapters = this.getCategoryChapters(moduleId);
    if (!chapters || chapters.length === 0) return false;
    return chapters.every(c => this.isChapterCompleted(c.id));
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

    let currentCourseId = localStorage.getItem('lang_app_last_course_id');
    if (!currentCourseId && this.availableCourses().length > 0) {
      currentCourseId = this.availableCourses()[0].id.toString();
    }
    const courseIdToUse = currentCourseId || 1;

    if (chapterId) {
      this.router.navigate([`/learn/play/${courseIdToUse}`], { queryParams: { chapterId: chapterId, view: 'content' } });
    } else {
      const filtered = this.getFilteredChapters();
      const firstChap = filtered.length > 0 ? filtered[0].id : null;
      if (firstChap) {
        localStorage.setItem('lang_app_last_chapter_id', firstChap.toString());
        this.router.navigate([`/learn/play/${courseIdToUse}`], { queryParams: { chapterId: firstChap, view: 'content' } });
      } else {
        this.router.navigate([`/learn/play/${courseIdToUse}`]);
      }
    }
  }

  launchGame(modeKey: string) {
    const mod = this.activeModule();
    this.router.navigate(['/learn/practice'], {
      queryParams: {
        mode: modeKey,
        module: mod ? mod.id : 'level_1'
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
    const legacyIds: number[] = legacyChaptersRaw ? JSON.parse(legacyChaptersRaw!) : [];
    const scopedIds: number[] = scopedChaptersRaw ? JSON.parse(scopedChaptersRaw!) : [];
    const allCompleted = new Set([...legacyIds, ...scopedIds]);

    if (allCompleted.has(chapId)) {
      return 3;
    }
    if (idx === 0) {
      return 2;
    }
    return 0;
  }
}
