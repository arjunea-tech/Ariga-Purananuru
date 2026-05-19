import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MCQOption {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface MCQData {
  id?: number;
  question: string;
  options: MCQOption[];
  explanation?: string;
}

@Component({
  selector: 'app-activity-mcq',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mcq-container glass-card">
      <div class="question-header">
        <span class="badge-tag">Multiple Choice</span>
        <h4 class="question-text" [innerHTML]="activity?.question"></h4>
      </div>

      <div class="options-grid">
        @for (option of activity?.options; track option.id; let idx = $index) {
          <button 
            type="button"
            class="option-row"
            [class.selected]="selectedOptionId() === option.id"
            [class.correct]="showFeedback && hasSubmitted() && option.isCorrect"
            [class.incorrect]="showFeedback && hasSubmitted() && selectedOptionId() === option.id && !option.isCorrect"
            [class.shake]="showFeedback && hasSubmitted() && selectedOptionId() === option.id && !option.isCorrect"
            [class.bounce]="showFeedback && hasSubmitted() && option.isCorrect && selectedOptionId() === option.id"
            [disabled]="showFeedback && hasSubmitted()"
            (click)="selectOption(option)">
            
            <div class="bubble">
              {{ getLetter(idx) }}
            </div>
            
            <span class="option-text">{{ option.text }}</span>

            <div class="status-icon" *ngIf="showFeedback && hasSubmitted()">
              @if (option.isCorrect) {
                <i class="bi bi-check-circle-fill text-success"></i>
              } @else if (selectedOptionId() === option.id) {
                <i class="bi bi-x-circle-fill text-danger"></i>
              }
            </div>
          </button>
        }
      </div>

      <!-- Expandable Explanation Block -->
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
    .mcq-container {
      margin-bottom: 1.5rem;
    }
    .question-header {
      margin-bottom: 1.5rem;
    }
    .badge-tag {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 50px;
      text-uppercase: uppercase;
      letter-spacing: 0.05em;
      display: inline-block;
      margin-bottom: 0.75rem;
    }
    .question-text {
      color: #1e293b;
      font-weight: 700;
      line-height: 1.4;
      margin: 0;
    }
    .options-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .option-row {
      display: flex;
      align-items: center;
      width: 100%;
      background: rgba(255, 255, 255, 0.9);
      border: 1.5px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1rem 1.25rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .option-row:hover:not(:disabled) {
      transform: translateY(-2px);
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
      background: #ffffff;
    }
    .option-row.selected {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.04);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
    }
    .option-row.correct {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.06);
    }
    .option-row.incorrect {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.06);
    }
    .bubble {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.2rem;
      height: 2.2rem;
      background: #f1f5f9;
      border-radius: 50%;
      font-weight: 700;
      color: #64748b;
      margin-right: 1.25rem;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .option-row:hover:not(:disabled) .bubble {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
    }
    .option-row.selected .bubble {
      background: #3b82f6;
      color: #ffffff;
    }
    .option-row.correct .bubble {
      background: #10b981;
      color: #ffffff;
    }
    .option-row.incorrect .bubble {
      background: #ef4444;
      color: #ffffff;
    }
    .option-text {
      color: #334155;
      font-weight: 500;
      font-size: 1rem;
      flex-grow: 1;
    }
    .status-icon {
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      margin-left: 1rem;
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
    
    /* Animations */
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .shake {
      animation: shake 0.4s ease-in-out;
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .bounce {
      animation: bounce 0.4s ease-in-out;
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
export class MCQComponent {
  @Input() activity: MCQData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ selectedOptionId: number; isCorrect: boolean }>();

  selectedOptionId = signal<number | null>(null);
  hasSubmitted = signal<boolean>(false);

  selectOption(option: MCQOption): void {
    if (this.showFeedback && this.hasSubmitted()) return;

    this.selectedOptionId.set(option.id);
    
    if (this.showFeedback) {
      this.hasSubmitted.set(true);
    }

    this.answered.emit({
      selectedOptionId: option.id,
      isCorrect: option.isCorrect
    });
  }

  getLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  reset(): void {
    this.selectedOptionId.set(null);
    this.hasSubmitted.set(false);
  }
}
