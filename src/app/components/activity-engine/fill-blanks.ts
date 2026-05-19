import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FillBlanksData {
  id?: number;
  text: string; // "The [cat] is on the [mat]."
  explanation?: string;
}

interface Segment {
  type: 'text' | 'blank';
  value: string; // Text content or correct answer
  blankIndex?: number;
}

@Component({
  selector: 'app-activity-fill-blanks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fill-blanks-container glass-card">
      <div class="header">
        <span class="badge-tag">Fill in the Blanks</span>
      </div>

      <div class="sentence-flow">
        @for (segment of segments; track $index) {
          @if (segment.type === 'text') {
            <span class="plain-text">{{ segment.value }}</span>
          } @else {
            <span class="input-wrapper">
              <input
                type="text"
                class="blank-input"
                [class.correct]="showFeedback && hasSubmitted() && isCorrect(segment.blankIndex!)"
                [class.incorrect]="showFeedback && hasSubmitted() && !isCorrect(segment.blankIndex!)"
                [disabled]="showFeedback && hasSubmitted()"
                [style.width.ch]="getInputWidth(segment.blankIndex!, segment.value)"
                [(ngModel)]="userAnswers()[segment.blankIndex!]"
                (input)="onInputChange()"
                placeholder="..." />
              
              <!-- Inline green check or red correct value popup -->
              @if (showFeedback && hasSubmitted()) {
                <span class="feedback-badge" [class.correct]="isCorrect(segment.blankIndex!)">
                  @if (isCorrect(segment.blankIndex!)) {
                    <i class="bi bi-check-lg"></i>
                  } @else {
                    <i class="bi bi-x-lg"></i>
                    <span class="correct-hint">{{ segment.value }}</span>
                  }
                </span>
              }
            </span>
          }
        }
      </div>

      <!-- Action Button for Low-Stakes Practice (Instant Feedback) -->
      @if (showFeedback && !hasSubmitted()) {
        <button 
          type="button" 
          class="btn-check-answers" 
          [disabled]="!isAnyAnswered()"
          (click)="checkAnswers()">
          Check Answers
        </button>
      }

      <!-- Explanation Box -->
      @if (showFeedback && hasSubmitted() && activity?.explanation) {
        <div class="explanation-box animate-fade-in">
          <div class="explanation-title">
            <i class="bi bi-info-circle-fill"></i>
            <span>Explanation</span>
          </div>
          <p class="explanation-text">{{ activity?.explanation }}</p>
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
    }
    .fill-blanks-container {
      margin-bottom: 1.5rem;
    }
    .header {
      margin-bottom: 1.25rem;
    }
    .badge-tag {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 50px;
      text-uppercase: uppercase;
      letter-spacing: 0.05em;
      display: inline-block;
    }
    .sentence-flow {
      line-height: 2.2;
      font-size: 1.15rem;
      color: #1e293b;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }
    .plain-text {
      white-space: pre-wrap;
    }
    .input-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      margin: 0 0.25rem;
      vertical-align: middle;
    }
    .blank-input {
      border: none;
      border-bottom: 2px solid #cbd5e1;
      background: rgba(241, 245, 249, 0.6);
      text-align: center;
      font-weight: 600;
      color: #0f172a;
      border-radius: 4px 4px 0 0;
      padding: 0.1rem 0.4rem;
      font-size: 1.15rem;
      transition: all 0.2s ease;
      min-width: 4ch;
      max-width: 25ch;
      outline: none;
    }
    .blank-input:focus {
      border-bottom-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }
    .blank-input.correct {
      border-bottom-color: #10b981;
      color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }
    .blank-input.incorrect {
      border-bottom-color: #ef4444;
      color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }
    .feedback-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.25rem;
      font-size: 0.9rem;
      font-weight: 700;
    }
    .feedback-badge.correct {
      color: #10b981;
    }
    .feedback-badge:not(.correct) {
      color: #ef4444;
      gap: 0.25rem;
    }
    .correct-hint {
      font-size: 0.75rem;
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 700;
      text-decoration: line-through; /* show standard cross, but show suggestion */
      display: inline-block;
      text-decoration: none; /* remove line-through so it's a helpful hint label */
    }
    .btn-check-answers {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #white;
      color: white;
      font-weight: 700;
      padding: 0.75rem 1.75rem;
      border-radius: 0.75rem;
      border: none;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-check-answers:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }
    .btn-check-answers:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
    }
    .explanation-box {
      margin-top: 1.5rem;
      background: rgba(245, 158, 11, 0.08);
      border-left: 4px solid #f59e0b;
      border-radius: 0.5rem;
      padding: 1.25rem;
    }
    .explanation-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #d97706;
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    .explanation-text {
      color: #451a03;
      margin: 0;
      font-size: 0.925rem;
      line-height: 1.5;
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
export class FillBlanksComponent implements OnInit {
  @Input() activity: FillBlanksData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ answers: string[]; isCorrect: boolean }>();

  segments: Segment[] = [];
  userAnswers = signal<string[]>([]);
  hasSubmitted = signal<boolean>(false);

  ngOnInit(): void {
    this.parseSentence();
  }

  parseSentence(): void {
    if (!this.activity || !this.activity.text) return;

    const regex = /\[(.*?)\]/g;
    let match;
    let lastIndex = 0;
    let blankCounter = 0;
    const tempSegments: Segment[] = [];
    const initialAnswers: string[] = [];

    while ((match = regex.exec(this.activity.text)) !== null) {
      const matchIndex = match.index;
      const matchedText = match[0];
      const answerValue = match[1];

      // Add leading text segment if there is one
      if (matchIndex > lastIndex) {
        tempSegments.push({
          type: 'text',
          value: this.activity.text.substring(lastIndex, matchIndex)
        });
      }

      // Add blank segment
      tempSegments.push({
        type: 'blank',
        value: answerValue,
        blankIndex: blankCounter
      });

      initialAnswers.push('');
      blankCounter++;
      lastIndex = regex.lastIndex;
    }

    // Add trailing text segment if there is one
    if (lastIndex < this.activity.text.length) {
      tempSegments.push({
        type: 'text',
        value: this.activity.text.substring(lastIndex)
      });
    }

    this.segments = tempSegments;
    this.userAnswers.set(initialAnswers);
  }

  getInputWidth(blankIndex: number, correctValue: string): number {
    const userVal = this.userAnswers()[blankIndex];
    const baseLength = userVal ? userVal.length : 3;
    // dynamically resize inputs as the user types
    return Math.max(4, Math.min(25, baseLength + 0.5));
  }

  onInputChange(): void {
    if (!this.showFeedback) {
      // In standalone timed/evaluation player, emit standard answers list automatically to parent
      this.emitProgress();
    }
  }

  isAnyAnswered(): boolean {
    return this.userAnswers().some(ans => ans && ans.trim().length > 0);
  }

  isCorrect(blankIndex: number): boolean {
    const blank = this.segments.find(s => s.type === 'blank' && s.blankIndex === blankIndex);
    if (!blank) return false;
    const correct = blank.value.trim().toLowerCase();
    const user = (this.userAnswers()[blankIndex] || '').trim().toLowerCase();
    return correct === user;
  }

  checkAnswers(): void {
    if (this.hasSubmitted()) return;

    this.hasSubmitted.set(true);
    this.emitProgress();
  }

  emitProgress(): void {
    const answersList = this.userAnswers();
    const blanks = this.segments.filter(s => s.type === 'blank');
    const allCorrect = blanks.every(b => {
      const correctVal = b.value.trim().toLowerCase();
      const userVal = (answersList[b.blankIndex!] || '').trim().toLowerCase();
      return correctVal === userVal;
    });

    this.answered.emit({
      answers: answersList,
      isCorrect: allCorrect
    });
  }

  reset(): void {
    this.userAnswers.set(new Array(this.userAnswers().length).fill(''));
    this.hasSubmitted.set(false);
  }
}
