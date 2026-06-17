import { environment } from '../../../environments/environment';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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

interface AiQuizQuestion {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
}

import type { McvDatatreeNode } from 'mcv-ui-toolkit';
import { RouterModule } from '@angular/router';
import { AssessmentPlayerComponent } from '../activity-engine/assessment-player/assessment-player';
import { ActivityRenderer } from '../activity-engine/activity-renderer/activity-renderer';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';
import { AiTutorChatComponent } from '../ai-tutor-chat/ai-tutor-chat.component';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, RouterModule, AssessmentPlayerComponent, ActivityRenderer, TranslateModule, FormsModule, AiTutorChatComponent],
  templateUrl: './course-player.html',
  styleUrls: ['./course-player.css']
})
export class CoursePlayer implements OnInit {
  environment = environment;
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  protected authService = inject(AuthService);
  private translate = inject(TranslateService);
  private sanitizer = inject(DomSanitizer);

  currentLang = signal('en');

  courseId = signal<number | null>(null);
  userId = signal<number>(1);

  courseStructure = signal<CourseStructure | null>(null);
  treeData = signal<McvDatatreeNode[]>([]);
  activeContentId = signal<number | null>(null);
  fullContent = signal<Content | null>(null);

  // Learning navigation steps
  activeStep = signal<'lesson' | 'activity' | 'ai' | 'assessment'>('lesson');
  currentActivityIndex = signal<number>(0);

  lessonBlocks = computed(() => {
    return this.parsedBlocks().filter((b: any) => b.type !== 'activity');
  });

  activityBlocks = computed(() => {
    return this.parsedBlocks().filter((b: any) => b.type === 'activity');
  });

  // Student dashboard signals
  stats = signal<any>(null);
  courses = signal<any[]>([]);
  isProfileDropdownOpen = signal<boolean>(false);
  showTreeInline = signal<boolean>(true);
  selectedChapterId = signal<number | null>(null);

  // Achievements for the achievements screen
  achievements = signal<any[]>([]);

  // Sidebar collapse state
  isSidebarCollapsed = signal<boolean>(false);
  isCourseNavCollapsed = signal<boolean>(false);

  // Selected language (default from admin settings or localStorage)
  selectedLang = signal<string>(localStorage.getItem('lang') || 'en');

  currentScreen = signal<'dashboard' | 'courses' | 'achievements' | 'progress' | 'settings' | 'continue'>('dashboard');

  // Interactive activities state
  currentActivityQuestionIndex = signal<number>(0);
  selectedOptionIndex = signal<number | null>(null);
  isAnswered = signal<boolean>(false);
  activityAnswers = signal<{ [key: number]: number }>({});
  activityScore = signal<{ score: number, total: number } | null>(null);

  // Flashcards state
  currentFlashcardIndex = signal<number>(0);
  isFlipped = signal<boolean>(false);

  // Match the following state
  selectedMatchTerm = signal<string | null>(null);
  selectedMatchDef = signal<string | null>(null);
  matchedPairs = signal<string[]>([]);
  matchError = signal<boolean>(false);

  // Assessment state
  selectedAssessmentId = signal<number | null>(null);

  // Course list search/filter
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');

  /** Switch UI language */
  updateLanguage(lang: string): void {
    this.selectedLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    this.currentLang.set(lang);

  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }

  toggleCourseNav(): void {
    this.isCourseNavCollapsed.set(!this.isCourseNavCollapsed());
  }

  getCourseCategory(course: any): string {
    const name = course.name || '';
    if (name.includes('Tamil') || name.includes('Purananuru') || name.includes('Kural') || name.includes('தமிழ்') || name.includes('யாப்பு')) {
      return 'Language & Literature';
    }
    return 'LMS Course';
  }

  courseCategories = computed(() => {
    const cats = new Set<string>();
    cats.add('All');
    for (const c of this.courses()) {
      cats.add(this.getCourseCategory(c));
    }
    return Array.from(cats);
  });

  filteredCourses = computed(() => {
    let list = this.courses();
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    
    if (query) {
      list = list.filter(c => 
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.description && c.description.toLowerCase().includes(query))
      );
    }
    
    if (cat !== 'All') {
      list = list.filter(c => this.getCourseCategory(c) === cat);
    }
    
    return list;
  });

  // Settings form bindings
  settingsName = signal<string>('');
  settingsEmail = signal<string>('');

  // Dynamic activities signals
  activeTopicActivities = signal<any | null>(null);
  isLoadingActivities = signal<boolean>(false);
  shuffledDefinitions = signal<string[]>([]);

  // AI Tutor signals
  isChatOpen = signal<boolean>(false);

  // AI Quiz signals
  isGeneratingQuiz = signal<boolean>(false);
  aiQuizData = signal<AiQuizQuestion[]>([]);
  aiQuizAnswers = signal<{ [key: number]: number }>({}); // Maps question index to selected option index
  aiQuizScore = signal<{ score: number, total: number } | null>(null);

  videoUrl = computed(() => {
    const content = this.activeContent();
    if (!content || !content.external_url) return null;

    // Find the first URL that is either a video or a YouTube URL
    for (const url of content.external_url) {
      if (typeof url === 'string') {
        let cleanedUrl = url.replace(/\\/g, '/'); // replace backslashes with forward slashes

        // Check if it's a local absolute path
        const publicIndex = cleanedUrl.indexOf('/public/');
        if (publicIndex !== -1) {
          cleanedUrl = cleanedUrl.substring(publicIndex + 8); // remove "/public/" prefix
        } else if (cleanedUrl.includes('public/assets/')) {
          cleanedUrl = cleanedUrl.substring(cleanedUrl.indexOf('public/') + 7); // remove "public/" prefix
        } else if (/^[A-Za-z]:\//.test(cleanedUrl)) { // e.g. D:/... or C:/...
          const assetsIndex = cleanedUrl.indexOf('/assets/');
          if (assetsIndex !== -1) {
            cleanedUrl = cleanedUrl.substring(assetsIndex + 1); // e.g. "assets/videos/..."
          }
        }

        const lowerUrl = cleanedUrl.toLowerCase();
        if (
          lowerUrl.endsWith('.mp4') ||
          lowerUrl.endsWith('.webm') ||
          lowerUrl.endsWith('.ogg') ||
          lowerUrl.includes('youtube.com') ||
          lowerUrl.includes('youtu.be')
        ) {
          // Add leading slash for correct routing resolving if it is local asset and doesn't have one
          if (!cleanedUrl.startsWith('http') && !cleanedUrl.startsWith('/')) {
            cleanedUrl = '/' + cleanedUrl;
          }
          return cleanedUrl;
        }
      }
    }
    return null;
  });

  isVideoLocal = computed(() => {
    const url = this.videoUrl();
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('/assets/videos/');
  });

  youtubeEmbedUrl = computed(() => {
    const url = this.videoUrl();
    if (!url) return null;
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const parts = url.split('v=');
      if (parts.length > 1) {
        videoId = parts[1].split('&')[0];
      }
    } else if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/');
      if (parts.length > 1) {
        videoId = parts[1].split('?')[0];
      }
    } else if (url.includes('youtube.com/embed/')) {
      const parts = url.split('youtube.com/embed/');
      if (parts.length > 1) {
        videoId = parts[1].split('?')[0];
      }
    }
    if (videoId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
    }
    return null;
  });

  activeChapterId = computed(() => {
    const contentId = this.activeContentId();
    const structure = this.courseStructure();
    if (!contentId || !structure) return null;
    for (const level of structure.levels) {
      for (const chapter of level.chapters) {
        if (chapter.contents.some(c => c.id === contentId)) {
          return chapter.id;
        }
      }
    }
    return null;
  });

  isChapterCompleted = computed(() => {
    const chapterId = this.activeChapterId() || this.selectedChapterId();
    const completedIds = this.stats()?.completed_chapter_ids;
    if (!chapterId || !completedIds) return false;
    return completedIds.includes(chapterId);
  });

  selectedChapter = computed(() => {
    const chapterId = this.selectedChapterId();
    const structure = this.courseStructure();
    if (!chapterId || !structure) return null;

    for (const level of structure.levels) {
      const chapter = level.chapters.find(c => c.id === chapterId);
      if (chapter) return chapter;
    }
    return null;
  });

  selectedChapterCompleted = computed(() => {
    const id = this.selectedChapterId();
    const completedIds = this.stats()?.completed_chapter_ids || [];
    return id !== null && completedIds.includes(id);
  });

  courseProgress = computed(() => {
    const structure = this.courseStructure();
    const completedIds = this.stats()?.completed_chapter_ids || [];
    if (!structure) return { completed: 0, total: 0, percentage: 0 };

    let total = 0;
    let completed = 0;

    structure.levels.forEach(level => {
      level.chapters.forEach(chapter => {
        total++;
        if (completedIds.includes(chapter.id)) {
          completed++;
        }
      });
    });

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  });

  totalAssessments = computed(() => {
    const structure = this.courseStructure();
    if (!structure) return 0;
    let count = 0;
    structure.levels.forEach(level => {
      level.chapters.forEach(chapter => {
        if (chapter.assessments && chapter.assessments.length > 0) {
          count += chapter.assessments.length;
        }
      });
    });
    return count;
  });

  getUnlockedBadgesCount(): number {
    const badges = this.stats()?.badges || [];
    return badges.filter((b: any) => b.unlocked).length;
  }

  radarPolygonPoints = computed(() => {
    const mastery = this.stats()?.skill_mastery || {
      sangam_literature: 0,
      ancient_ethics: 0,
      tamil_culture: 0,
      historic_wisdom: 0,
      heroic_poetry: 0,
      social_conduct: 0
    };

    const s1 = (mastery.sangam_literature || 0) / 100 * 40;
    const s2 = (mastery.ancient_ethics || 0) / 100 * 40;
    const s3 = (mastery.tamil_culture || 0) / 100 * 40;
    const s4 = (mastery.historic_wisdom || 0) / 100 * 40;
    const s5 = (mastery.heroic_poetry || 0) / 100 * 40;
    const s6 = (mastery.social_conduct || 0) / 100 * 40;

    const p1 = `50,${50 - s1}`;
    const p2 = `${50 + 0.866 * s2},${50 - 0.5 * s2}`;
    const p3 = `${50 + 0.866 * s3},${50 + 0.5 * s3}`;
    const p4 = `50,${50 + s4}`;
    const p5 = `${50 - 0.866 * s5},${50 + 0.5 * s5}`;
    const p6 = `${50 - 0.866 * s6},${50 - 0.5 * s6}`;

    return `${p1} ${p2} ${p3} ${p4} ${p5} ${p6}`;
  });

  xpLevelInfo = computed(() => {
    const xp = this.stats()?.xp_points || 0;
    const level = Math.floor(xp / 500) + 1;
    const currentLevelXp = xp % 500;
    const requiredXp = 500;
    const percentage = Math.min(100, Math.round((currentLevelXp / requiredXp) * 100));
    
    let rank = 'NOVICE';
    if (level >= 8) rank = 'GRAND MASTER';
    else if (level >= 5) rank = 'EXPERT';
    else if (level >= 3) rank = 'SCHOLAR';

    return {
      level,
      currentLevelXp,
      requiredXp,
      percentage,
      rank,
      xp
    };
  });

  monthlyActivityPath = computed(() => {
    const activity = this.stats()?.monthly_activity || [
      { month: 'Jan', hours: 0 },
      { month: 'Feb', hours: 0 },
      { month: 'Mar', hours: 0 },
      { month: 'Apr', hours: 0 },
      { month: 'May', hours: 0 },
      { month: 'Jun', hours: 0 }
    ];

    const points = activity.map((item: any, idx: number) => {
      const x = idx * 20;
      const y = 25 - ((item.hours || 0) / 40) * 20;
      return { x, y, month: item.month, hours: item.hours };
    });

    const linePath = points.map((p: any, idx: number) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillPath = `${linePath} L 100 25 L 0 25 Z`;

    return {
      linePath,
      fillPath,
      points
    };
  });

  streakCalendarDays = computed(() => {
    const streak = this.stats()?.study_streak || 0;
    const daysCount = 30;
    const cells = [];
    
    for (let i = 1; i <= daysCount; i++) {
      let level = 0;
      if (i > daysCount - streak) {
        level = 3;
      } else {
        level = (i * 7) % 5 === 0 ? 1 : ((i * 3) % 7 === 0 ? 2 : 0);
      }
      cells.push({ day: i, level });
    }
    return cells;
  });

  flatChapters = computed(() => {
    const struct = this.courseStructure();
    if (!struct) return [];
    
    const list: Chapter[] = [];
    if (struct.levels) {
      for (const level of struct.levels) {
        if (level.chapters) {
          for (const chapter of level.chapters) {
            list.push(chapter);
          }
        }
      }
    }
    return list;
  });

  isTopicCompleted(chapterId: number, topicId: number): boolean {
    const completedIds = this.stats()?.completed_chapter_ids || [];
    if (completedIds.includes(chapterId)) {
      return true;
    }
    
    const chapter = this.flatChapters().find(c => c.id === chapterId);
    if (chapter) {
      const activeId = this.activeContentId();
      const activeIndex = chapter.contents.findIndex(c => c.id === activeId);
      const topicIndex = chapter.contents.findIndex(c => c.id === topicId);
      
      if (activeIndex !== -1 && topicIndex !== -1 && topicIndex < activeIndex) {
        return true;
      }
    }
    
    return false;
  }

  // Computed values
  activeContent = computed(() => {
    const id = this.activeContentId();
    const full = this.fullContent();

    if (!id || !this.courseStructure()) return null;

    // If we have full content and its ID matches the active ID, return it
    if (full && full.id === id) {
      // Find chapter assessments to append
      for (const level of this.courseStructure()!.levels) {
        for (const chapter of level.chapters) {
          const topic = chapter.contents.find(c => c.id === id);
          if (topic) {
            return { ...full, assessments: chapter.assessments };
          }
        }
      }
      return full;
    }

    // Fallback to sidebar structure (titles only) while loading
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

  isJsonContent = computed(() => {
    const content = this.activeContent();
    if (!content || !content.text_content) return false;
    const trimmed = content.text_content.trim();
    return trimmed.startsWith('{') && trimmed.endsWith('}');
  });

  parsedBlocks = computed(() => {
    const content = this.activeContent();
    if (!content || !content.text_content) return [];
    try {
      const data = JSON.parse(content.text_content);
      return data.blocks || [];
    } catch (e) {
      console.warn('Failed to parse text_content as JSON blocks, rendering as HTML instead.');
      return [];
    }
  });

  ngOnInit(): void {
    const savedLang = localStorage.getItem('lang') || 'en';
    this.translate.setDefaultLang('en');
    this.translate.use(savedLang);
    this.selectedLang.set(savedLang);
    this.currentLang.set(savedLang);

    const user = this.authService.getUser();
    if (user) {
      this.settingsName.set(user.name);
      this.settingsEmail.set(user.email || '');
    }
    this.route.params.subscribe(params => {
      if (params['courseId']) {
        this.courseId.set(+params['courseId']);
        this.loadStructure();
      } else {
        this.checkQueryParams();
      }
    });
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

  checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.courseId.set(+params['id']);
        this.loadStructure();
      } else {
        this.courseId.set(null);
        this.loadStudentDashboardData(false);
      }
    });
  }

  loadStudentDashboardData(skipAutoSelect = false): void {
    this.http.get<any>(`${environment.apiUrl}/student/dashboard`).subscribe({
      next: (res) => this.stats.set(res),
      error: (err) => console.error('Failed to load student dashboard stats', err)
    });

    this.http.get<any[]>(`${environment.apiUrl}/courses`).subscribe({
      next: (res) => {
        this.courses.set(res);
      
      // Load achievements if we are on the achievements screen
      if (this.currentScreen() === 'achievements') {
        this.http.get<any[]>(`${environment.apiUrl}/student/achievements`)
          .subscribe({
            next: (list) => this.achievements.set(list),
            error: (err) => console.error('Failed to load achievements', err)
          });
      }
    },
      error: (err) => console.error('Failed to load courses list', err)
    });
  }

  selectCourse(id: number): void {
    this.courseId.set(id);
    this.selectedChapterId.set(null);
    this.activeContentId.set(null);
    this.activeStep.set('lesson');
    this.isSidebarCollapsed.set(true); // Collapse sidebar when a course is selected
    
    // Fetch course structure
    this.loadStructure();
  }

  markChapterCompleted(): void {
    const chapterId = this.activeChapterId();
    if (!chapterId) return;

    this.http.post<any>(`${environment.apiUrl}/chapters/${chapterId}/complete`, {}).subscribe({
      next: () => {
        this.loadStudentDashboardData(true);
      },
      error: (err) => console.error('Failed to mark chapter as completed:', err)
    });
  }



  loadStructure(): void {
    if (!this.courseId()) return;

    const url = `${environment.apiUrl}/courses/${this.courseId()}/player-structure`;
    this.http.get<CourseStructure>(url).subscribe({
      next: (structure) => {
        // Initialize expansion states
        structure.levels.forEach((l) => {
          l.is_expanded = true;
          l.chapters.forEach((c, index) => {
            const hasActiveTopic = this.activeContentId() && c.contents.some(t => t.id === this.activeContentId());
            c.is_expanded = index === 0 || !!hasActiveTopic;
          });
        });
        this.courseStructure.set(structure);
        this.treeData.set(this.mapStructureToTree(structure));

      },
      error: (err) => console.error('Failed to load course structure:', err)
    });
  }

  continueCourse(): void {
    const structure = this.courseStructure();
    if (!structure) return;

    const completedIds = this.stats()?.completed_chapter_ids || [];

    // Find the first chapter that is NOT completed, and select its first content topic
    for (const level of structure.levels) {
      for (const chapter of level.chapters) {
        if (!completedIds.includes(chapter.id) && chapter.contents.length > 0) {
          this.selectTopic(chapter.contents[0].id);
          return;
        }
      }
    }

    // Fallback: select the very first topic of the course if all are completed or none found
    if (structure.levels[0]?.chapters[0]?.contents[0]) {
      this.selectTopic(structure.levels[0].chapters[0].contents[0].id);
    }
  }

  toggleCourseTree(id: number): void {
    if (this.courseId() === id) {
      this.showTreeInline.set(!this.showTreeInline());
    } else {
      this.courseId.set(id);
      this.showTreeInline.set(true);
      this.selectedChapterId.set(null);
      this.activeContentId.set(null);
      this.fullContent.set(null);

      const url = `${environment.apiUrl}/courses/${id}/player-structure`;
      this.http.get<CourseStructure>(url).subscribe({
        next: (structure) => {
          structure.levels.forEach((l) => {
            l.is_expanded = true;
            l.chapters.forEach((c, index) => {
              const hasActiveTopic = this.activeContentId() && c.contents.some(t => t.id === this.activeContentId());
              c.is_expanded = index === 0 || !!hasActiveTopic;
            });
          });
          this.courseStructure.set(structure);
          this.treeData.set(this.mapStructureToTree(structure));
          this.continueCourse();
        },
        error: (err) => console.error('Failed to load course structure:', err)
      });
    }
  }
  startCourse(id: number): void {
    this.toggleCourseTree(id);
  }

  selectTopic(id: number): void {
    this.activeContentId.set(id);
    this.fullContent.set(null); // Reset while loading
    this.activeStep.set('lesson'); // Reset navigation step to lesson
    this.currentActivityIndex.set(0); // Reset interactive activity index
    this.selectedAssessmentId.set(null); // Reset assessment selection

    // Fetch full content details
    const url = `${environment.apiUrl}/contents/${id}`;
    this.http.get<Content>(url).subscribe({
      next: (content) => {
        this.fullContent.set(content);
      },
      error: (err) => console.error('Failed to load topic content:', err)
    });

    this.loadTopicActivities(id);
  }

  toggleLevel(level: Level): void {
    level.is_expanded = !level.is_expanded;
  }

  toggleChapter(chapter: Chapter): void {
    chapter.is_expanded = !chapter.is_expanded;
    // Trigger signal update so Angular detects it
    this.courseStructure.update(s => s ? { ...s } : null);
  }

  mapStructureToTree(structure: CourseStructure): McvDatatreeNode[] {
    return structure.levels.map((level) => ({
      id: `level-${level.id}`,
      label: level.name,
      expanded: level.is_expanded,
      children: level.chapters.map((chapter) => ({
        id: `chapter-${chapter.id}`,
        label: chapter.name,
        expanded: chapter.is_expanded,
        children: chapter.contents.map((topic) => ({
          id: `topic-${topic.id}`,
          label: topic.title || topic.name,
        })),
      })),
    }));
  }

  handleNodeClick(node: McvDatatreeNode): void {
    if (node.id.startsWith('topic-')) {
      const topicId = parseInt(node.id.replace('topic-', ''), 10);
      this.selectedChapterId.set(null);
      this.selectTopic(topicId);
      // Reset quiz state on topic change
      this.aiQuizData.set([]);
      this.aiQuizAnswers.set({});
      this.aiQuizScore.set(null);
    } else if (node.id.startsWith('chapter-')) {
      const chapterId = parseInt(node.id.replace('chapter-', ''), 10);
      this.activeContentId.set(null);
      this.fullContent.set(null);
      this.selectedChapterId.set(chapterId);
    }
  }

  toggleChat(): void {
    this.isChatOpen.set(!this.isChatOpen());
  }

  generateAiQuiz(): void {
    const contentId = this.activeContentId();
    if (!contentId) return;

    this.isGeneratingQuiz.set(true);
    this.aiQuizData.set([]);
    this.aiQuizAnswers.set({});
    this.aiQuizScore.set(null);

    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    };

    this.http.post<any>(`${environment.apiUrl}/ai-tutor/generate-quiz`, { content_id: contentId }, { headers }).subscribe({
      next: (res) => {
        this.isGeneratingQuiz.set(false);
        if (res.quiz && Array.isArray(res.quiz)) {
          this.aiQuizData.set(res.quiz);
        }
      },
      error: (err) => {
        console.error('AI Quiz Error:', err);
        this.isGeneratingQuiz.set(false);
        alert('Failed to generate practice quiz. Please try again.');
      }
    });
  }

  selectAiQuizOption(qIndex: number, oIndex: number): void {
    if (this.aiQuizScore() !== null) return; // Prevent changing answer after submission
    const current = this.aiQuizAnswers();
    this.aiQuizAnswers.set({ ...current, [qIndex]: oIndex });
  }

  submitAiQuiz(): void {
    const questions = this.aiQuizData();
    const answers = this.aiQuizAnswers();
    let score = 0;

    questions.forEach((q, qIndex) => {
      const selectedOptIndex = answers[qIndex];
      if (selectedOptIndex !== undefined && q.options[selectedOptIndex]?.isCorrect) {
        score++;
      }
    });

    this.aiQuizScore.set({ score, total: questions.length });
  }

  // Load dynamic activities
  loadTopicActivities(id: number): void {
    this.isLoadingActivities.set(true);
    this.activeTopicActivities.set(null);
    this.shuffledDefinitions.set([]);
    this.resetActivity();
    this.resetMatch();

    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    };

    this.http.post<any>(`${environment.apiUrl}/contents/${id}/activities`, {}, { headers }).subscribe({
      next: (res) => {
        this.isLoadingActivities.set(false);
        if (res.activities) {
          this.activeTopicActivities.set(res.activities);
          // Shuffle match definitions
          const matchPairs = res.activities.match || [];
          const definitions = matchPairs.map((p: any) => p.definition);
          for (let i = definitions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [definitions[i], definitions[j]] = [definitions[j], definitions[i]];
          }
          this.shuffledDefinitions.set(definitions);
        }
      },
      error: (err) => {
        console.error('Failed to load topic activities:', err);
        this.isLoadingActivities.set(false);
      }
    });
  }

  getCorrectOptionIndex(qIndex: number): number {
    const mcqs = this.activeTopicActivities()?.mcq || [];
    const mcq = mcqs[qIndex];
    if (!mcq) return -1;
    return mcq.options.findIndex((opt: any) => opt.isCorrect);
  }

  isDefinitionMatched(def: string): boolean {
    const matchPairs = this.activeTopicActivities()?.match || [];
    const pair = matchPairs.find((p: any) => p.definition === def);
    return pair ? this.matchedPairs().includes(pair.term) : false;
  }

  // Interactive MCQ Activity methods
  selectActivityOption(qIndex: number, oIndex: number): void {
    if (this.isAnswered()) return;
    this.selectedOptionIndex.set(oIndex);
  }

  submitActivityAnswer(qIndex: number, selectedIndex: number, correctIndex: number): void {
    this.isAnswered.set(true);
    const current = this.activityAnswers();
    this.activityAnswers.set({ ...current, [qIndex]: selectedIndex });
  }

  nextActivityQuestion(totalQuestions: number): void {
    this.isAnswered.set(false);
    this.selectedOptionIndex.set(null);
    const currentQ = this.currentActivityQuestionIndex();
    if (currentQ < totalQuestions - 1) {
      this.currentActivityQuestionIndex.set(currentQ + 1);
    } else {
      // Calculate scores
      let correctCount = 0;
      const answers = this.activityAnswers();
      const mcqs = this.activeTopicActivities()?.mcq || [];
      mcqs.forEach((mcq: any, idx: number) => {
        const selectedIdx = answers[idx];
        if (selectedIdx !== undefined && mcq.options[selectedIdx]?.isCorrect) {
          correctCount++;
        }
      });
      this.activityScore.set({ score: correctCount, total: totalQuestions });
      
      // Record XP and streak on backend
      this.recordActivityXp('mcq', correctCount, totalQuestions);
    }
  }

  recordActivityXp(type: string, score: number, total: number): void {
    const contentId = this.activeContentId();
    if (!contentId) return;

    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    };

    this.http.post<any>(`${environment.apiUrl}/student/record-activity`, {
      content_id: contentId,
      activity_type: type,
      score: score,
      total: total
    }, { headers }).subscribe({
      next: () => {
        // Refresh all stats including XP & streak
        this.loadStudentDashboardData(true);
      },
      error: (err) => {
        console.error('Failed to record activity XP:', err);
        // Still refresh stats as fallback
        this.loadStudentDashboardData(true);
      }
    });
  }

  resetActivity(): void {
    this.currentActivityQuestionIndex.set(0);
    this.selectedOptionIndex.set(null);
    this.isAnswered.set(false);
    this.activityAnswers.set({});
    this.activityScore.set(null);
  }

  // Flashcards methods
  toggleFlashcardFlip(): void {
    this.isFlipped.set(!this.isFlipped());
  }

  nextFlashcard(totalCards: number): void {
    this.isFlipped.set(false);
    const idx = this.currentFlashcardIndex();
    if (idx < totalCards - 1) {
      this.currentFlashcardIndex.set(idx + 1);
    } else {
      this.currentFlashcardIndex.set(0);
    }
  }

  prevFlashcard(totalCards: number): void {
    this.isFlipped.set(false);
    const idx = this.currentFlashcardIndex();
    if (idx > 0) {
      this.currentFlashcardIndex.set(idx - 1);
    } else {
      this.currentFlashcardIndex.set(totalCards - 1);
    }
  }

  // Match the following methods
  selectMatch(type: 'term' | 'def', value: string): void {
    if (type === 'term') {
      if (this.matchedPairs().includes(value)) return;
      this.selectedMatchTerm.set(value);
    } else {
      this.selectedMatchDef.set(value);
    }

    const term = this.selectedMatchTerm();
    const def = this.selectedMatchDef();

    if (term && def) {
      const correctMatches: { [key: string]: string } = {};
      const matchPairs = this.activeTopicActivities()?.match || [];
      matchPairs.forEach((pair: any) => {
        correctMatches[pair.term] = pair.definition;
      });

      if (correctMatches[term] === def) {
        this.matchedPairs.update(prev => [...prev, term]);
        this.selectedMatchTerm.set(null);
        this.selectedMatchDef.set(null);
        this.matchError.set(false);
        
        // Refresh dashboard statistics on matching all
        if (this.matchedPairs().length === matchPairs.length) {
          this.recordActivityXp('match', matchPairs.length, matchPairs.length);
        }
      } else {
        this.matchError.set(true);
        setTimeout(() => {
          this.selectedMatchTerm.set(null);
          this.selectedMatchDef.set(null);
          this.matchError.set(false);
        }, 800);
      }
    }
  }

  resetMatch(): void {
    this.selectedMatchTerm.set(null);
    this.selectedMatchDef.set(null);
    this.matchedPairs.set([]);
    this.matchError.set(false);
    
    // Reshuffle definitions
    const matchPairs = this.activeTopicActivities()?.match || [];
    const definitions = matchPairs.map((p: any) => p.definition);
    for (let i = definitions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [definitions[i], definitions[j]] = [definitions[j], definitions[i]];
    }
    this.shuffledDefinitions.set(definitions);
  }

  // Settings
  saveSettingsChanges(): void {
    this.authService.updateProfile({
      name: this.settingsName(),
      email: this.settingsEmail()
    }).subscribe({
      next: (res) => {
        alert('Settings saved successfully!');
        const user = this.authService.getUser();
        if (user) {
          this.settingsName.set(user.name);
          this.settingsEmail.set(user.email || '');
        }
        this.loadStudentDashboardData(true);
      },
      error: (err) => {
        console.error('Failed to save settings:', err);
        alert('Failed to update settings profile.');
      }
    });
  }

  // General navigation helpers
  switchScreen(screen: 'dashboard' | 'courses' | 'achievements' | 'progress' | 'settings' | 'continue'): void {
    this.courseId.set(null);
    this.currentScreen.set(screen);
    this.selectedChapterId.set(null);
    this.activeContentId.set(null);
    this.fullContent.set(null);
    this.loadStudentDashboardData(true);
  }

  goBackToDashboard(): void {
    this.switchScreen('dashboard');
  }

  continueLearning(): void {
    const list = this.courses();
    if (list && list.length > 0) {
      this.currentScreen.set('continue');
      this.selectCourse(list[0].id);
    } else {
      this.switchScreen('courses');
    }
  }

  selectAssessment(assessmentId: number, chapter: Chapter): void {
    // Select the first topic of the chapter so content context exists
    if (chapter.contents && chapter.contents.length > 0) {
      this.activeContentId.set(chapter.contents[0].id);
    }
    this.selectedAssessmentId.set(assessmentId);
    this.activeStep.set('assessment');
  }

  onAssessmentCompleted(event: { score: number; passed: boolean }): void {
    // Record XP for assessment completion
    this.recordActivityXp('assessment', event.score, 100);
  }
}
