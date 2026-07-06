import { Component, input, Output, EventEmitter, OnInit, OnDestroy, signal, effect, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityRenderer } from '../activity-engine/activity-renderer/activity-renderer';
import { PracticeEngineComponent } from '../practice-engine/practice-engine.component';
import { AudioService } from '../../services/audio.service';
import confetti from 'canvas-confetti';
import { gsap } from 'gsap';

export interface LessonStep {
  type: 'video' | 'pdf' | 'reading' | 'practice' | 'activity' | 'assessment';
  title: string;
  data: any;
}

@Component({
  selector: 'app-kids-lesson-player',
  standalone: true,
  imports: [CommonModule, ActivityRenderer, PracticeEngineComponent],
  templateUrl: './kids-lesson-player.html',
  styleUrls: ['./kids-lesson-player.css']
})
export class KidsLessonPlayer implements OnInit, OnDestroy {
  lessonSequence = input<LessonStep[]>([]);
  currentStepIndex = input<number>(0);
  lessonFinished = input<boolean>(false);
  showGameOver = input<boolean>(false);
  hearts = input<number>(5);
  xp = input<number>(0);
  coins = input<number>(0);
  activityFeedbackState = input<'correct' | 'incorrect' | null>(null);

  @Output() quit = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
  @Output() finish = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();
  @Output() nextStep = new EventEmitter<void>();
  @Output() prevStep = new EventEmitter<void>();
  @Output() activityAnswered = new EventEmitter<any>();
  @Output() practiceCompleted = new EventEmitter<void>();
  @Output() continueFeedback = new EventEmitter<void>();

  private audioService = inject(AudioService);

  currentContentPage = signal<number>(0);
  typedContent = signal<string>('');
  typingTimeout: any;
  activeUtterances: SpeechSynthesisUtterance[] = [];
  speechStartTimeout: any;
  pageSize = 2;
  isFullscreen = signal(false);

  currentStep = computed(() => {
    if (this.lessonSequence().length > 0 && this.currentStepIndex() >= 0 && this.currentStepIndex() < this.lessonSequence().length) {
      return this.lessonSequence()[this.currentStepIndex()];
    }
    return null;
  });

  rawReadingHtml = computed(() => {
    const step = this.currentStep();
    if (step && step.type === 'reading') {
      if (step.data.isJson) {
        const pageData = step.data.blocks[this.currentContentPage()];
        if (!pageData) return '';

        const renderBlock = (block: any) => {
          if (block.type === 'paragraph' || block.type === 'text') return `<div class="opacity-75 mb-4" style="text-align: left;">${block.data.text}</div>`;
          else if (block.type === 'header') return `<h3 class="fw-bold text-primary mb-3" style="font-size: 1.7rem;">${block.data.text}</h3>`;
          else if (block.type === 'list') {
            return `<ul class="mb-4 ps-4 opacity-75 text-start d-inline-block">` + block.data.items.map((i: any) => `<li class="mb-2">${typeof i === 'string' ? i : (i.content || '')}</li>`).join('') + `</ul>`;
          }
          else if (block.type === 'image') {
            const url = block.data.file?.url || block.data.url || '';
            const caption = block.data.caption || '';
            return `<div class="text-center mb-4"><img src="${url}" alt="${caption}" class="img-fluid rounded shadow-sm" style="max-height: 350px; object-fit: contain;">${caption ? `<div class="text-muted small mt-2">${caption}</div>` : ''}</div>`;
          }
          else if (block.type === 'table') {
            const withHeadings = block.data.withHeadings;
            const rows = block.data.content || [];
            let html = `<div class="table-responsive w-100 mb-4"><table class="table table-bordered shadow-sm" style="border-radius: 12px; overflow: hidden; background: white;">`;
            rows.forEach((row: string[], index: number) => {
              if (index === 0 && withHeadings) {
                html += `<thead style="background: #fef08a;"><tr>` + row.map(cell => `<th class="p-2 text-dark fs-5 fw-bold border-bottom-0">${cell}</th>`).join('') + `</tr></thead><tbody>`;
              } else {
                if (index === 0 && !withHeadings) html += `<tbody>`;
                html += `<tr>` + row.map(cell => `<td class="p-2 fs-6 opacity-75">${cell}</td>`).join('') + `</tr>`;
              }
            });
            if (rows.length > 0) html += `</tbody>`;
            html += `</table></div>`;
            return html;
          }
          return '';
        };

        if (Array.isArray(pageData)) {
          return pageData.map((b: any) => renderBlock(b)).join('');
        } else {
          return renderBlock(pageData);
        }
      } else {
        return `<div class="fw-bold opacity-75" style="font-size: 1.8rem; line-height: 1.6; font-family: 'Nunito', 'Comic Sans MS', sans-serif;">${step.data.text}</div>`;
      }
    }
    return '';
  });

  constructor() {
    effect(() => {
      const html = this.rawReadingHtml();
      if (html) {
        this.speakText(html);
      } else {
        this.stopSpeech();
        this.typedContent.set('');
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const state = this.activityFeedbackState();
      if (state === 'correct') {
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
      } else if (state === 'incorrect') {
        setTimeout(() => {
          gsap.fromTo('.mascot-sad',
            { x: -15, rotation: -20 },
            { x: 15, rotation: 20, duration: 0.1, repeat: 5, yoyo: true, ease: 'sine.inOut' }
          );
          gsap.to('.mascot-sad', { x: 0, rotation: 0, duration: 0.3, delay: 0.6 });
        }, 50);
      }
    });

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  ngOnInit(): void {
    this.currentContentPage.set(0);
  }

  ngOnDestroy() {
    this.stopSpeech();
    clearTimeout(this.typingTimeout);
  }


  goToMap() {
    this.quit.emit();
  }

  retryActivity() {
    this.retry.emit();
  }

  finishLesson() {
    this.finish.emit();
  }

  onVideoEnded() {
    this.stepCompleted.emit(true);
    this.nextStep.emit();
  }

  nextContentPage() {
    const step = this.currentStep();
    if (step && step.type === 'reading' && step.data.isJson && step.data.blocks) {
      if (this.currentContentPage() < step.data.blocks.length - 1) {
        this.currentContentPage.update(p => p + 1);
        const isComplete = this.currentContentPage() >= step.data.blocks.length - 1;
        this.stepCompleted.emit(isComplete);
      }
    }
  }

  prevContentPage() {
    this.currentContentPage.update(p => Math.max(0, p - 1));
    this.stepCompleted.emit(false); // Can't be complete if moving backwards
  }

  onActivityAnswered(event: any) {
    this.activityAnswered.emit(event);
  }

  onPracticeCompleted() {
    this.practiceCompleted.emit();
    this.nextLessonStep(); // Automatically proceed to the next step (Activity)
  }

  continueFromFeedback() {
    this.continueFeedback.emit();
  }

  nextLessonStep() {
    this.nextStep.emit();
    this.currentContentPage.set(0);
    this.stopSpeech();
  }

  prevLessonStep() {
    this.prevStep.emit();
    this.currentContentPage.set(0);
    this.stopSpeech();
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


  stopSpeech() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.activeUtterances = [];
    clearTimeout(this.speechStartTimeout);
  }

  speakText(text: string | null) {
    if (!text) return;

    this.stopSpeech();

    let cleanText = '';
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;

      const parts: string[] = [];
      const traverse = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const content = node.textContent?.trim();
          if (content) {
            parts.push(content);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = (node as Element).tagName.toLowerCase();

          if (tagName === 'li') {
            parts.push(', ');
          }

          for (let i = 0; i < node.childNodes.length; i++) {
            traverse(node.childNodes[i]);
          }

          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'li', 'tr'].includes(tagName)) {
            parts.push('. ');
          }
        }
      };

      traverse(tempDiv);
      cleanText = parts.join(' ')
        .replace(/\s+/g, ' ')
        .replace(/\.\s*\./g, '.')
        .replace(/,\s*\./g, '.')
        .trim();
    } catch (e) {
      cleanText = text.replace(/<[^>]*>?/gm, '');
    }

    if (!cleanText) return;

    const isTamil = /[\u0B80-\u0BFF]/.test(cleanText);

    let typewriterStarted = false;
    const startTypewriterSafely = () => {
      if (typewriterStarted) return;
      typewriterStarted = true;
      this.startTypewriter(text, isTamil);
    };

    this.speechStartTimeout = setTimeout(startTypewriterSafely, 800);

    const rawSentences = cleanText.split(/([.?!:;]+)/);
    const sentences: string[] = [];
    for (let i = 0; i < rawSentences.length; i += 2) {
      const textPart = rawSentences[i]?.trim();
      const delim = rawSentences[i + 1] || '';
      if (textPart) {
        sentences.push(textPart + (delim ? delim + ' ' : ''));
      }
    }

    if (sentences.length === 0) return;

    const getTamilVoiceScore = (name: string): number => {
      let score = 0;
      const lower = name.toLowerCase();
      if (lower.includes('kid') || lower.includes('child') || lower.includes('junior') || lower.includes('girl') || lower.includes('young')) score += 150;
      if (lower.includes('natural') || lower.includes('neural')) score += 100;
      if (lower.includes('online')) score += 50;
      if (lower.includes('google')) score += 40;
      if (lower.includes('lekha')) score += 30;
      if (lower.includes('heera')) score += 25;
      if (lower.includes('female') || lower.includes('girl') || lower.includes('woman') || lower.includes('pallavi') || lower.includes('kalpana') || lower.includes('siri')) score += 20;
      if (lower.includes('valluvar')) score += 15;
      if (lower.includes('microsoft')) score += 10;
      return score;
    };

    const getEnglishVoiceScore = (name: string): number => {
      let score = 0;
      const lower = name.toLowerCase();
      if (lower.includes('kid') || lower.includes('child') || lower.includes('junior') || lower.includes('girl') || lower.includes('young')) score += 150;
      if (lower.includes('natural') || lower.includes('neural')) score += 100;
      if (lower.includes('online')) score += 50;
      if (lower.includes('google')) score += 40;
      if (lower.includes('female') || lower.includes('girl') || lower.includes('woman') || lower.includes('zira') || lower.includes('samantha') || lower.includes('aria') || lower.includes('jenny') || lower.includes('siri')) score += 30;
      if (lower.includes('microsoft') || lower.includes('david')) score += 10;
      return score;
    };

    sentences.forEach((sentence, idx) => {
      const utterance = new SpeechSynthesisUtterance(sentence);

      if (isTamil) {
        utterance.lang = 'ta-IN';
        const voices = window.speechSynthesis.getVoices();
        const tamilVoices = voices.filter(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
        if (tamilVoices.length > 0) {
          const bestTamilVoice = tamilVoices.reduce((prev, curr) => {
            return getTamilVoiceScore(curr.name) > getTamilVoiceScore(prev.name) ? curr : prev;
          });
          utterance.voice = bestTamilVoice;
        }
      } else {
        utterance.lang = 'en-US';
        const voices = window.speechSynthesis.getVoices();
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        if (englishVoices.length > 0) {
          const bestEnglishVoice = englishVoices.reduce((prev, curr) => {
            return getEnglishVoiceScore(curr.name) > getEnglishVoiceScore(prev.name) ? curr : prev;
          });
          utterance.voice = bestEnglishVoice;
        }
      }

      utterance.rate = isTamil ? 0.82 : 0.85;
      utterance.pitch = 1.35;

      this.activeUtterances.push(utterance);

      if (idx === 0) {
        utterance.onstart = () => {
          clearTimeout(this.speechStartTimeout);
          startTypewriterSafely();
        };
      }

      utterance.onend = () => {
        this.activeUtterances = this.activeUtterances.filter(u => u !== utterance);
      };
      utterance.onerror = () => {
        clearTimeout(this.speechStartTimeout);
        startTypewriterSafely();
        this.activeUtterances = this.activeUtterances.filter(u => u !== utterance);
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  startTypewriter(htmlContent: string, isTamil: boolean = false) {
    this.typedContent.set('');
    clearTimeout(this.typingTimeout);

    let i = 0;
    let isTag = false;
    let currentText = '';

    const charDelay = isTamil ? Math.random() * 30 + 55 : Math.random() * 20 + 35;
    const sentenceDelay = isTamil ? 900 : 600;
    const commaDelay = isTamil ? 450 : 300;

    const type = () => {
      if (i < htmlContent.length) {
        let char = htmlContent.charAt(i);
        if (char === '<') isTag = true;

        currentText += char;
        i++;

        if (isTag) {
          while (i < htmlContent.length && htmlContent.charAt(i - 1) !== '>') {
            currentText += htmlContent.charAt(i);
            i++;
          }
          isTag = false;
          this.typedContent.set(currentText);
          this.typingTimeout = setTimeout(type, 0);
        } else {
          this.typedContent.set(currentText);
          const delay = char === '.' || char === '!' || char === '?' ? sentenceDelay : (char === ',' ? commaDelay : charDelay);
          this.typingTimeout = setTimeout(type, delay);
        }
      }
    };

    type();
  }
}
