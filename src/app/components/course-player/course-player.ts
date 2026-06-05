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

  // AI Tutor signals
  isChatOpen = signal<boolean>(false);
  chatMessages = signal<{ role: 'user' | 'ai', text: string }[]>([]);
  isAiTyping = signal<boolean>(false);
  chatInput = signal<string>('');

  //Voice Signals
  isListening = signal<boolean>(false);
  speechRecognition: any = null;

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


    // Initialize Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = false;
        this.speechRecognition.lang = this.currentLang() === 'ta' ? 'ta-IN' : 'en-US';

        this.speechRecognition.onstart = () => {
          this.isListening.set(true);
        };

        this.speechRecognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          this.chatInput.set(transcript);
          this.sendChatMessage();
        };

        this.speechRecognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          this.isListening.set(false);
        };

        this.speechRecognition.onend = () => {
          this.isListening.set(false);
        };
      }
    }
  }

  switchLanguage(event: Event) {
    const lang = (event.target as HTMLSelectElement).value;
    this.translate.use(lang);
    localStorage.setItem('userLang', lang);
    this.currentLang.set(lang);
    if (this.speechRecognition) {
      this.speechRecognition.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
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
      },
      error: (err) => console.error('Failed to load courses list', err)
    });
  }

  selectCourse(id: number): void {
    this.courseId.set(id);
    this.showTreeInline.set(true);
    this.selectedChapterId.set(null);
    this.activeContentId.set(null);
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
    this.showTreeInline.set(true);
    this.selectedChapterId.set(null);
    this.loadStudentDashboardData(true);
  }

  loadStructure(): void {
    if (!this.courseId()) return;

    const url = `http://localhost:8000/api/courses/${this.courseId()}/player-structure`;
    this.http.get<CourseStructure>(url).subscribe({
      next: (structure) => {
        // Initialize expansion states
        structure.levels.forEach((l) => {
          l.is_expanded = false;
          l.chapters.forEach((c) => {
            c.is_expanded = false;
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

      const url = `http://localhost:8000/api/courses/${id}/player-structure`;
      this.http.get<CourseStructure>(url).subscribe({
        next: (structure) => {
          structure.levels.forEach((l) => {
            l.is_expanded = false;
            l.chapters.forEach((c) => {
              c.is_expanded = false;
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
    if (this.isChatOpen() && this.chatMessages().length === 0) {
      const key = this.activeContentId() ? 'STUDENT.ASK_ANYTHING' : 'STUDENT.ASK_GENERAL';
      const welcomeText = this.translate.instant(key);
      this.chatMessages.set([
        { role: 'ai', text: welcomeText }
      ]);
    }
  }

  sendChatMessage(): void {
    const input = this.chatInput().trim();
    if (!input) return;

    // Add user message
    this.chatMessages.set([...this.chatMessages(), { role: 'user', text: input }]);
    this.chatInput.set('');
    this.isAiTyping.set(true);

    const payload = {
      message: input
    };

    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    };

    this.http.post<any>('http://localhost:8000/api/ai-tutor/chat', payload, { headers }).subscribe({
      next: (res) => {
        this.isAiTyping.set(false);
        this.chatMessages.set([...this.chatMessages(), { role: 'ai', text: res.reply }]);
        this.speakText(res.reply);
      },
      error: (err) => {
        console.error('AI Tutor Error:', err);
        this.isAiTyping.set(false);
        this.chatMessages.set([...this.chatMessages(), { role: 'ai', text: 'Sorry, I encountered an error connecting to the AI.' }]);
      }
    });
  }

  toggleListening(): void {
    if (!this.speechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening()) {
      this.speechRecognition.stop();
    } else {
      this.speechRecognition.start();
    }
  }

  speakText(text: string): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Remove markdown or special characters before speaking
      const plainText = text.replace(/[*#_]/g, '');
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.lang = this.currentLang() === 'ta' ? 'ta-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
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
