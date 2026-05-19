import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MCQComponent } from './mcq';
import { FillBlanksComponent } from './fill-blanks';
import { FlashcardComponent } from './flashcard';
import { MatchComponent } from './match';

export interface NormalizedActivity {
  type: 'mcq' | 'fill_blanks' | 'flashcard' | 'match';
  question?: string;
  text?: string;
  front?: string;
  back?: string;
  explanation?: string;
  options?: any[];
  pairs?: any[];
}

@Component({
  selector: 'app-activity-renderer',
  standalone: true,
  imports: [
    CommonModule,
    MCQComponent,
    FillBlanksComponent,
    FlashcardComponent,
    MatchComponent
  ],
  template: `
    @if (normalizedActivity(); as data) {
      <div class="activity-renderer-container">
        @switch (data.type) {
          @case ('mcq') {
            <app-activity-mcq 
              [activity]="data" 
              [showFeedback]="showFeedback"
              (answered)="onMCQAnswered($event)">
            </app-activity-mcq>
          }
          @case ('fill_blanks') {
            <app-activity-fill-blanks 
              [activity]="data" 
              [showFeedback]="showFeedback"
              (answered)="onBlanksAnswered($event)">
            </app-activity-fill-blanks>
          }
          @case ('flashcard') {
            <app-activity-flashcard 
              [activity]="data" 
              [showFeedback]="showFeedback"
              (answered)="onFlashcardAnswered($event)">
            </app-activity-flashcard>
          }
          @case ('match') {
            <app-activity-match 
              [activity]="data" 
              [showFeedback]="showFeedback"
              (answered)="onMatchAnswered($event)">
            </app-activity-match>
          }
        }
      </div>
    }
  `,
  styles: [`
    .activity-renderer-container {
      width: 100%;
      margin: 1.25rem 0;
    }
  `]
})
export class ActivityRenderer implements OnChanges {
  @Input() activity: any = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<any>();

  normalizedActivity = signal<any | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.normalizeInput();
    }
  }

  private normalizeInput(): void {
    if (!this.activity) {
      this.normalizedActivity.set(null);
      return;
    }

    const raw = this.activity;
    
    // 1. Determine type
    let typeInput = raw.type || raw.question_type || 'mcq';
    let type: 'mcq' | 'fill_blanks' | 'flashcard' | 'match' = 'mcq';

    if (['multiple_choice', 'mcq', 'multiple-choice', 'multiplechoice'].includes(typeInput.toLowerCase())) {
      type = 'mcq';
    } else if (['fill_in_the_blanks', 'fill_blanks', 'fill-blanks', 'fillinblanks', 'blanks'].includes(typeInput.toLowerCase())) {
      type = 'fill_blanks';
    } else if (['flashcard', 'flashcards'].includes(typeInput.toLowerCase())) {
      type = 'flashcard';
    } else if (['match_following', 'match', 'match-following', 'matchfollowing'].includes(typeInput.toLowerCase())) {
      type = 'match';
    }

    // 2. Extract explanation & options
    const additional = raw.additional_data || {};
    const explanation = raw.explanation || additional.explanation || '';

    const normalized: NormalizedActivity = {
      type,
      explanation
    };

    if (type === 'mcq') {
      normalized.question = raw.question || raw.question_text || '';
      const rawOptions = raw.options || additional.options || [];
      normalized.options = rawOptions.map((opt: any, idx: number) => ({
        id: opt.id ?? idx,
        text: opt.option_text ?? opt.text ?? '',
        isCorrect: !!(opt.is_correct ?? opt.isCorrect ?? false)
      }));
    } else if (type === 'fill_blanks') {
      normalized.text = raw.text || raw.question_text || '';
    } else if (type === 'flashcard') {
      normalized.front = raw.front || additional.front || raw.question_text || '';
      normalized.back = raw.back || additional.back || '';
    } else if (type === 'match') {
      normalized.pairs = raw.pairs || additional.pairs || [];
    }

    this.normalizedActivity.set(normalized);
  }

  // Event forwarders
  onMCQAnswered(event: any): void {
    // Forward response to parent component
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'mcq',
      ...event
    });
  }

  onBlanksAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'fill_blanks',
      ...event
    });
  }

  onFlashcardAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'flashcard',
      ...event
    });
  }

  onMatchAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'match',
      ...event
    });
  }
}
