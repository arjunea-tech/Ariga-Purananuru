import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MCQComponent, MCQData } from '../mcq/mcq';
import { FillBlanksComponent, FillBlanksData } from '../fill-blanks/fill-blanks';
import { FlashcardComponent, FlashcardData } from '../flashcard/flashcard';
import { MatchComponent, MatchData } from '../match/match';
import { CrosswordComponent, CrosswordData, CrosswordWord } from '../crossword/crossword';
import { WordArrangeComponent, WordArrangeData } from '../word-arrange/word-arrange';

export interface NormalizedActivity {
  type: 'mcq' | 'fill_blanks' | 'flashcard' | 'match' | 'crossword' | 'word_arrange';
  question?: string;
  text?: string;
  front?: string;
  back?: string;
  explanation?: string;
  options?: any[];
  pairs?: any[];
  gridSize?: number;
  words?: any[];
  matchMode?: 'drag_drop' | 'click_match';
  theme?: 'cloud' | 'standard';
  allowDragDrop?: boolean;
  allowClickMatch?: boolean;
  enableAudio?: boolean;
}

@Component({
  selector: 'app-activity-renderer',
  standalone: true,
  imports: [
    CommonModule,
    MCQComponent,
    FillBlanksComponent,
    FlashcardComponent,
    MatchComponent,
    CrosswordComponent,
    WordArrangeComponent
  ],
  templateUrl: './activity-renderer.html',
  styleUrls: ['./activity-renderer.css']
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
    let type: 'mcq' | 'fill_blanks' | 'flashcard' | 'match' | 'crossword' | 'word_arrange' = 'mcq';

    if (['multiple_choice', 'mcq', 'multiple-choice', 'multiplechoice'].includes(typeInput.toLowerCase())) {
      type = 'mcq';
    } else if (['fill_in_the_blanks', 'fill_blanks', 'fill-blanks', 'fillinblanks', 'blanks'].includes(typeInput.toLowerCase())) {
      type = 'fill_blanks';
    } else if (['flashcard', 'flashcards'].includes(typeInput.toLowerCase())) {
      type = 'flashcard';
    } else if (['match_following', 'match', 'match-following', 'matchfollowing', 'cloud_match', 'cloud-match', 'cloudmatch'].includes(typeInput.toLowerCase())) {
      type = 'match';
    } else if (['crossword', 'crossword_puzzle'].includes(typeInput.toLowerCase())) {
      type = 'crossword';
    } else if (['word_arrange', 'word-arrange', 'wordarrange', 'sentence_unscramble', 'sentence-unscramble'].includes(typeInput.toLowerCase())) {
      type = 'word_arrange';
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
      // If it is originally a cloud_match, default the theme to 'cloud' for backwards compatibility
      normalized.theme = raw.theme ?? additional.theme ?? (typeInput.toLowerCase().includes('cloud') ? 'cloud' : 'standard');
      
      const rawMode = raw.matchMode ?? additional.matchMode;
      normalized.allowDragDrop = !!(raw.allowDragDrop ?? additional.allowDragDrop ?? (rawMode !== 'click_match'));
      normalized.allowClickMatch = !!(raw.allowClickMatch ?? additional.allowClickMatch ?? (rawMode !== 'drag_drop'));
      
      normalized.enableAudio = !!(raw.enableAudio ?? additional.enableAudio ?? false);
    } else if (type === 'crossword') {
      normalized.gridSize = raw.gridSize || additional.gridSize || 10;
      normalized.words = raw.words || additional.words || [];
    } else if (type === 'word_arrange') {
      normalized.text = raw.text || additional.text || raw.question_text || '';
      normalized.question = raw.question || raw.question_text || '';
    }

    this.normalizedActivity.set(normalized);
  }

  // Event forwarders
  onMCQAnswered(event: any): void {
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

  onCrosswordAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'crossword',
      ...event
    });
  }

  onWordArrangeAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'word_arrange',
      ...event
    });
  }
}
