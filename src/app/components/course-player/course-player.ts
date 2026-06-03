import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

import { McvDatatree, McvDatatreeNode } from 'mcv-ui-toolkit';
import { RouterModule } from '@angular/router';
import { ActivityRenderer } from '../activity-engine/activity-renderer/activity-renderer';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, McvDatatree, RouterModule, ActivityRenderer, TranslateModule, FormsModule],
  templateUrl: './course-player.html',
  styleUrls: ['./course-player.css']
})
export class CoursePlayer implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  protected authService = inject(AuthService);
  private translate = inject(TranslateService);

  currentLang = signal('en');

  courseId = signal<number | null>(null);
  userId = signal<number>(1);

  courseStructure = signal<CourseStructure | null>(null);
  treeData = signal<McvDatatreeNode[]>([]);
  activeContentId = signal<number | null>(null);
  fullContent = signal<Content | null>(null);

  // Student dashboard signals
  stats = signal<any>(null);
  courses = signal<any[]>([]);

  // AI Tutor signals
  isChatOpen = signal<boolean>(false);
  chatMessages = signal<{role: 'user' | 'ai', text: string}[]>([]);
  isAiTyping = signal<boolean>(false);
  chatInput = signal<string>('');

  // AI Quiz signals
  isGeneratingQuiz = signal<boolean>(false);
  aiQuizData = signal<AiQuizQuestion[]>([]);
  aiQuizAnswers = signal<{[key: number]: number}>({}); // Maps question index to selected option index
  aiQuizScore = signal<{score: number, total: number} | null>(null);

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
    const chapterId = this.activeChapterId();
    const completedIds = this.stats()?.completed_chapter_ids;
    if (!chapterId || !completedIds) return false;
    return completedIds.includes(chapterId);
  });

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
    this.currentLang.set(localStorage.getItem('userLang') || 'en');
    this.route.params.subscribe(params => {
      if (params['courseId']) {
        this.courseId.set(+params['courseId']);
        this.loadStructure();
      } else {
        this.checkQueryParams();
      }
    });
  }

  switchLanguage(event: Event) {
    const lang = (event.target as HTMLSelectElement).value;
    this.translate.use(lang);
    localStorage.setItem('userLang', lang);
    this.currentLang.set(lang);
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
    this.http.get<any>('http://localhost:8000/api/student/dashboard').subscribe({
      next: (res) => this.stats.set(res),
      error: (err) => console.error('Failed to load student dashboard stats', err)
    });

    this.http.get<any[]>('http://localhost:8000/api/courses').subscribe({
      next: (res) => {
        this.courses.set(res);
        // If there is only one course available, auto-open the learning path for immediate learning
        if (res && res.length === 1 && !this.courseId() && !skipAutoSelect) {
          this.selectCourse(res[0].id);
        }
      },
      error: (err) => console.error('Failed to load courses list', err)
    });
  }

  selectCourse(id: number): void {
    this.courseId.set(id);
    this.loadStructure();
  }

  markChapterCompleted(): void {
    const chapterId = this.activeChapterId();
    if (!chapterId) return;

    this.http.post<any>(`http://localhost:8000/api/chapters/${chapterId}/complete`, {}).subscribe({
      next: () => {
        this.loadStudentDashboardData(true);
      },
      error: (err) => console.error('Failed to mark chapter as completed:', err)
    });
  }

  goBackToDashboard(): void {
    this.courseId.set(null);
    this.courseStructure.set(null);
    this.activeContentId.set(null);
    this.fullContent.set(null);
    this.loadStudentDashboardData(true);
  }

  loadStructure(): void {
    if (!this.courseId()) return;

    const url = `http://localhost:8000/api/courses/${this.courseId()}/player-structure`;
    this.http.get<CourseStructure>(url).subscribe({
      next: (structure) => {
        // Initialize expansion states
        structure.levels.forEach((l, idx) => {
          l.is_expanded = idx === 0; 
          l.chapters.forEach((c, cidx) => {
            c.is_expanded = idx === 0 && cidx === 0;
          });
        });
        this.courseStructure.set(structure);
        this.treeData.set(this.mapStructureToTree(structure));

        // Auto-select first topic
        if (structure.levels[0]?.chapters[0]?.contents[0]) {
          this.selectTopic(structure.levels[0].chapters[0].contents[0].id);
        }
      },
      error: (err) => console.error('Failed to load course structure:', err)
    });
  }

  selectTopic(id: number): void {
    this.activeContentId.set(id);
    this.fullContent.set(null); // Reset while loading

    // Fetch full content details
    const url = `http://localhost:8000/api/contents/${id}`;
    this.http.get<Content>(url).subscribe({
      next: (content) => {
        this.fullContent.set(content);
      },
      error: (err) => console.error('Failed to load topic content:', err)
    });
  }

  toggleLevel(level: Level): void {
    level.is_expanded = !level.is_expanded;
  }

  toggleChapter(chapter: Chapter): void {
    chapter.is_expanded = !chapter.is_expanded;
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
      this.selectTopic(topicId);
      // Reset quiz state on topic change
      this.aiQuizData.set([]);
      this.aiQuizAnswers.set({});
      this.aiQuizScore.set(null);
    }
  }

  toggleChat(): void {
    this.isChatOpen.set(!this.isChatOpen());
    if (this.isChatOpen() && this.chatMessages().length === 0) {
      this.chatMessages.set([
        { role: 'ai', text: 'Hello! I am your AI Tutor. Ask me any questions about this lesson!' }
      ]);
    }
  }

  sendChatMessage(): void {
    const input = this.chatInput().trim();
    if (!input || !this.activeContentId()) return;

    // Add user message
    this.chatMessages.set([...this.chatMessages(), { role: 'user', text: input }]);
    this.chatInput.set('');
    this.isAiTyping.set(true);

    const payload = {
      content_id: this.activeContentId(),
      message: input
    };

    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    };

    this.http.post<any>('http://localhost:8000/api/ai-tutor/chat', payload, { headers }).subscribe({
      next: (res) => {
        this.isAiTyping.set(false);
        this.chatMessages.set([...this.chatMessages(), { role: 'ai', text: res.reply }]);
      },
      error: (err) => {
        console.error('AI Tutor Error:', err);
        this.isAiTyping.set(false);
        this.chatMessages.set([...this.chatMessages(), { role: 'ai', text: 'Sorry, I encountered an error connecting to the AI.' }]);
      }
    });
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

    this.http.post<any>('http://localhost:8000/api/ai-tutor/generate-quiz', { content_id: contentId }, { headers }).subscribe({
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
}
