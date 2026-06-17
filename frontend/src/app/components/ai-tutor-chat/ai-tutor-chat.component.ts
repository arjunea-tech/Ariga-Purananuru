import { Component, OnInit, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ai-tutor-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './ai-tutor-chat.component.html',
  styleUrl: './ai-tutor-chat.component.css'
})
export class AiTutorChatComponent implements OnInit {
  private http = inject(HttpClient);
  private translate = inject(TranslateService);

  // Inputs mapped from course player
  activeContentId = input<number | null>(null);
  courseId = input<number | null>(null);
  isFloating = input<boolean>(false);

  chatMessages = signal<{ role: 'user' | 'ai', text: string, isTranslationKey?: boolean, is_verified_static?: boolean, sources?: string[], suggested_questions?: string[] }[]>([]);
  isAiTyping = signal<boolean>(false);
  chatInput = signal<string>('');
  isListening = signal<boolean>(false);
  speechRecognition: any = null;

  ngOnInit() {
    this.initSpeechRecognition();
    // Start with welcome message if empty
    if (this.chatMessages().length === 0) {
      this.pushWelcomeMessage();
    }
  }

  pushWelcomeMessage() {
    const key = this.activeContentId() ? 'STUDENT.ASK_ANYTHING' : 'STUDENT.ASK_GENERAL';
    this.chatMessages.set([{ role: 'ai', text: key, isTranslationKey: true }]);

    if (!this.activeContentId()) {
      this.http.get<any[]>('https://sangam-ai.onrender.com/api/qa/starter').subscribe({
        next: (questions) => {
          if (questions && questions.length > 0) {
            const msgs = [...this.chatMessages()];
            if (msgs.length > 0 && msgs[0].role === 'ai') {
              msgs[0].suggested_questions = questions.map(q => q.question);
              this.chatMessages.set(msgs);
            }
          }
        },
        error: (err) => console.error('Failed to fetch starter questions', err)
      });
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
      content_id: this.activeContentId(),
      course_id: this.courseId(),
      message: input
    };

    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    };

    this.http.post<any>('https://sangam-ai.onrender.com/api/chat', payload, { headers }).subscribe({
      next: (res) => {
        this.isAiTyping.set(false);
        this.chatMessages.set([...this.chatMessages(), {
          role: 'ai',
          text: res.reply || res.answer || '',
          is_verified_static: res.is_verified_static,
          sources: res.sources,
          suggested_questions: res.suggested_questions
        }]);
        this.speakText(res.reply || res.answer || '');
      },
      error: (err) => {
        console.error('AI Tutor Error:', err);
        this.isAiTyping.set(false);
        this.chatMessages.set([...this.chatMessages(), { role: 'ai', text: 'Sorry, I encountered an error connecting to the AI.' }]);
      }
    });
  }

  sendSuggestedQuestion(suggestion: string): void {
    this.chatInput.set(suggestion);
    this.sendChatMessage();
  }

  newChat(): void {
    this.chatMessages.set([]);
    this.chatInput.set('');
    this.pushWelcomeMessage();
  }

  initSpeechRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = false;
        const currentLang = localStorage.getItem('lang') || 'en';
        this.speechRecognition.lang = currentLang === 'ta' ? 'ta-IN' : 'en-US';

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
      const plainText = text.replace(/[*#_]/g, '');
      const utterance = new SpeechSynthesisUtterance(plainText);
      const currentLang = localStorage.getItem('lang') || 'en';
      utterance.lang = currentLang === 'ta' ? 'ta-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }
}
