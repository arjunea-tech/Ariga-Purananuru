import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FlashcardData {
  id?: number;
  front: string; // Foreign word, e.g. "வணக்கம்"
  back: string;  // Translation, e.g. "Hello / Greetings"
  langCode?: string; // Language code for TTS, e.g., 'ta-IN' or 'en-US'
  audioUrl?: string; // Optional audio URL override
}

@Component({
  selector: 'app-activity-flashcard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flashcard-engine glass-card">
      <div class="header">
        <span class="badge-tag">Flashcard Practice</span>
      </div>

      <div class="card-scene" (click)="flipCard()">
        <div class="card-3d" [class.is-flipped]="isFlipped()">
          
          <!-- Front Face -->
          <div class="card-face card-front">
            <div class="card-content">
              <span class="card-side-label">Front</span>
              <h2 class="word-display">{{ activity?.front }}</h2>
              
              <!-- Pronunciation Play Button -->
              <button 
                type="button" 
                class="btn-speak" 
                (click)="speakWord($event)" 
                title="Listen Pronunciation">
                <i class="bi bi-volume-up-fill"></i>
                <span>Listen</span>
              </button>
            </div>
            <div class="card-footer-tip">
              Click Card to Flip <i class="bi bi-arrow-left-right"></i>
            </div>
          </div>

          <!-- Back Face -->
          <div class="card-face card-back">
            <div class="card-content">
              <span class="card-side-label">Back</span>
              <h3 class="meaning-display">{{ activity?.back }}</h3>
            </div>
            <div class="card-footer-tip">
              Click Card to Flip <i class="bi bi-arrow-left-right"></i>
            </div>
          </div>

        </div>
      </div>

      <!-- Action Log Buttons -->
      <div class="log-actions" *ngIf="showFeedback">
        <button 
          type="button" 
          class="btn-action again" 
          (click)="logFeedback(true)">
          <i class="bi bi-arrow-counterclockwise"></i> Study Again
        </button>
        <button 
          type="button" 
          class="btn-action knew" 
          (click)="logFeedback(false)">
          <i class="bi bi-check-lg"></i> I Knew This
        </button>
      </div>

      <!-- Log success message -->
      @if (studyLogged()) {
        <div class="logged-message animate-fade-in" [class.success]="!loggedAgain()">
          @if (loggedAgain()) {
            <i class="bi bi-arrow-repeat"></i> Added back to practice queue!
          } @else {
            <i class="bi bi-check-circle-fill"></i> Marked as learned!
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08);
      border-radius: 1.25rem;
      padding: 2rem;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .flashcard-engine {
      margin-bottom: 1.5rem;
      width: 100%;
    }
    .header {
      width: 100%;
      margin-bottom: 1.25rem;
      text-align: left;
    }
    .badge-tag {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 50px;
      text-uppercase: uppercase;
      letter-spacing: 0.05em;
      display: inline-block;
    }
    
    /* 3D Scene Card Setup */
    .card-scene {
      width: 100%;
      max-width: 400px;
      height: 250px;
      perspective: 1000px;
      cursor: pointer;
      margin-bottom: 1.75rem;
    }
    .card-3d {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card-3d.is-flipped {
      transform: rotateY(180deg);
    }
    .card-face {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      border-radius: 1.25rem;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.03);
    }
    .card-front {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      color: #0f172a;
    }
    .card-back {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #ffffff;
      transform: rotateY(180deg);
    }
    .card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-grow: 1;
      width: 100%;
    }
    .card-side-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-uppercase: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.4;
      margin-bottom: 0.75rem;
    }
    .card-back .card-side-label {
      color: rgba(255, 255, 255, 0.8);
      opacity: 0.7;
    }
    .word-display {
      font-size: 2.2rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 1rem;
      text-align: center;
    }
    .meaning-display {
      font-size: 1.75rem;
      font-weight: 700;
      color: #ffffff;
      text-align: center;
    }
    .btn-speak {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border: none;
      border-radius: 50px;
      padding: 0.4rem 1.2rem;
      font-weight: 700;
      font-size: 0.875rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-speak:hover {
      background: #3b82f6;
      color: #white;
      color: white;
      transform: scale(1.05);
    }
    .card-footer-tip {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .card-back .card-footer-tip {
      color: rgba(255, 255, 255, 0.6);
    }
    
    /* Log actions */
    .log-actions {
      display: flex;
      gap: 1rem;
      width: 100%;
      max-width: 400px;
    }
    .btn-action {
      flex: 1;
      border: none;
      padding: 0.75rem;
      font-weight: 700;
      border-radius: 0.75rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }
    .btn-action.again {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }
    .btn-action.again:hover {
      background: #f59e0b;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
    }
    .btn-action.knew {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }
    .btn-action.knew:hover {
      background: #10b981;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
    
    .logged-message {
      margin-top: 1rem;
      background: rgba(245, 158, 11, 0.08);
      color: #d97706;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
      border-radius: 50px;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .logged-message.success {
      background: rgba(16, 185, 129, 0.08);
      color: #10b981;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class FlashcardComponent {
  @Input() activity: FlashcardData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ studyAgain: boolean; correct: boolean }>();

  isFlipped = signal<boolean>(false);
  studyLogged = signal<boolean>(false);
  loggedAgain = signal<boolean>(false);

  flipCard(): void {
    this.isFlipped.update(v => !v);
  }

  speakWord(event: Event): void {
    event.stopPropagation(); // Avoid flipping card
    if (!this.activity || !this.activity.front) return;

    // Use SpeechSynthesis
    const utter = new SpeechSynthesisUtterance(this.activity.front);
    if (this.activity.langCode) {
      utter.lang = this.activity.langCode;
    } else {
      // Auto detect or default to Tamil/English
      utter.lang = 'en-US';
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  logFeedback(studyAgain: boolean): void {
    this.studyLogged.set(true);
    this.loggedAgain.set(studyAgain);
    this.answered.emit({
      studyAgain,
      correct: !studyAgain
    });

    // Auto reset notification after a short delay
    setTimeout(() => {
      this.studyLogged.set(false);
    }, 2000);
  }

  reset(): void {
    this.isFlipped.set(false);
    this.studyLogged.set(false);
  }
}
