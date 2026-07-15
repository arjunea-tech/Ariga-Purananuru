import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MCQComponent, MCQData } from '../mcq/mcq';
import { FillBlanksComponent, FillBlanksData } from '../fill-blanks/fill-blanks';
import { FlashcardComponent, FlashcardData } from '../flashcard/flashcard';
import { MatchComponent, MatchData } from '../match/match';
import { CrosswordComponent, CrosswordData, CrosswordWord } from '../crossword/crossword';
import { WordArrangeComponent, WordArrangeData } from '../word-arrange/word-arrange';
import { SpeakingComponent, SpeakingData } from '../speaking/speaking';
import { RolePlayComponent, RolePlayData } from '../role-play/role-play';
import { SequencingComponent, SequencingData } from '../sequencing/sequencing';
import { PartsOfSpeechComponent, PartsOfSpeechData } from '../parts-of-speech/parts-of-speech';
import { MindMapComponent, MindMapData } from '../mind-map/mind-map';
import { WritingComponent, WritingData } from '../writing/writing';
import { OddOneOutComponent, OddOneOutData } from '../odd-one-out/odd-one-out';
import { LetterBasketComponent, LetterBasketData } from '../letter-basket/letter-basket';

export interface NormalizedActivity {
  type: 'mcq' | 'fill_blanks' | 'flashcard' | 'match' | 'crossword' | 'word_arrange' | 'speaking' | 'role_play' | 'sequencing' | 'parts_of_speech' | 'mind_map' | 'writing' | 'odd_one_out' | 'letter_basket';
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
  
  // MCQ and Fill Blanks enhancements
  audioUrl?: string;
  imageUrl?: string;

  // Speaking properties
  targetText?: string;

  // Role Play properties
  dialogue?: any[];

  // Sequencing properties
  events?: string[];

  // Parts of Speech properties
  parts?: any[];

  // Mind Map properties
  nodes?: any[];

  // Writing properties
  starterText?: string;
  modelAnswer?: string;
  minWords?: number;
  maxWords?: number;
  items?: any[];
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
    WordArrangeComponent,
    SpeakingComponent,
    RolePlayComponent,
    SequencingComponent,
    PartsOfSpeechComponent,
    MindMapComponent,
    WritingComponent,
    OddOneOutComponent,
    LetterBasketComponent
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

  convertEditorJsToHtml(jsonStr: string): string {
    if (!jsonStr) return '';
    const trimmed = jsonStr.trim();
    if (!(trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      return jsonStr;
    }
    try {
      const data = JSON.parse(jsonStr);
      if (!data.blocks || !Array.isArray(data.blocks)) {
        return jsonStr;
      }
      return data.blocks.map((block: any) => {
        if (block.type === 'paragraph') {
          return `<p class="mb-3">${block.data.text || ''}</p>`;
        } else if (block.type === 'header') {
          return `<h${block.data.level} class="fw-bold mb-3">${block.data.text || ''}</h${block.data.level}>`;
        } else if (block.type === 'list') {
          const items = (block.data.items || []).map((item: string) => `<li>${item}</li>`).join('');
          return block.data.style === 'ordered' ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
        } else if (block.type === 'table') {
          const withHeadings = !!block.data.withHeadings;
          const rows = block.data.content || [];
          let tableHtml = '<div class="table-responsive mb-3"><table class="table table-bordered align-middle">';
          if (rows.length > 0) {
            if (withHeadings) {
              const headerCells = rows[0].map((cell: string) => `<th>${cell}</th>`).join('');
              tableHtml += `<thead><tr class="bg-light">${headerCells}</tr></thead>`;
              tableHtml += '<tbody>';
              for (let i = 1; i < rows.length; i++) {
                const bodyCells = rows[i].map((cell: string) => `<td>${cell}</td>`).join('');
                tableHtml += `<tr>${bodyCells}</tr>`;
              }
              tableHtml += '</tbody>';
            } else {
              tableHtml += '<tbody>';
              rows.forEach((row: any) => {
                const bodyCells = row.map((cell: string) => `<td>${cell}</td>`).join('');
                tableHtml += `<tr>${bodyCells}</tr>`;
              });
              tableHtml += '</tbody>';
            }
          }
          tableHtml += '</table></div>';
          return tableHtml;
        }
        return block.data.text || '';
      }).join('\n');
    } catch (e) {
      return jsonStr;
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
    let type: 'mcq' | 'fill_blanks' | 'flashcard' | 'match' | 'crossword' | 'word_arrange' | 'speaking' | 'role_play' | 'sequencing' | 'parts_of_speech' | 'mind_map' | 'writing' | 'odd_one_out' | 'letter_basket' = 'mcq';

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
    } else if (['speaking', 'voice-recorder', 'voice_recorder', 'pronunciation'].includes(typeInput.toLowerCase())) {
      type = 'speaking';
    } else if (['role_play', 'role-play', 'dialogue', 'conversation'].includes(typeInput.toLowerCase())) {
      type = 'role_play';
    } else if (['sequencing', 'ordering', 'sequence'].includes(typeInput.toLowerCase())) {
      type = 'sequencing';
    } else if (['parts_of_speech', 'parts-of-speech', 'tagging', 'sentence_tagging'].includes(typeInput.toLowerCase())) {
      type = 'parts_of_speech';
    } else if (['mind_map', 'mind-map', 'concept_map'].includes(typeInput.toLowerCase())) {
      type = 'mind_map';
    } else if (['writing', 'essay', 'paragraph_writing', 'story_writing'].includes(typeInput.toLowerCase())) {
      type = 'writing';
    } else if (['odd_one_out', 'odd-one-out', 'oddoneout'].includes(typeInput.toLowerCase())) {
      type = 'odd_one_out';
    } else if (['letter_basket', 'letter-basket', 'letterbasket'].includes(typeInput.toLowerCase())) {
      type = 'letter_basket';
    }

    // 2. Extract explanation & options
    const additional = raw.additional_data || {};
    const explanation = this.convertEditorJsToHtml(raw.explanation || additional.explanation || '');

    const normalized: NormalizedActivity = {
      type,
      explanation
    };

    if (type === 'mcq') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.audioUrl = raw.media_url || additional.audioUrl || '';
      const rawOptions = raw.options || additional.options || [];
      normalized.options = rawOptions.map((opt: any, idx: number) => ({
        id: opt.id ?? idx,
        text: opt.option_text ?? opt.text ?? '',
        isCorrect: !!(opt.is_correct ?? opt.isCorrect ?? false)
      }));
    } else if (type === 'fill_blanks') {
      normalized.text = this.convertEditorJsToHtml(raw.text || raw.question_text || '');
      normalized.audioUrl = raw.media_url || additional.audioUrl || '';
      normalized.imageUrl = additional.imageUrl || '';
    } else if (type === 'flashcard') {
      normalized.front = this.convertEditorJsToHtml(raw.front || additional.front || raw.question_text || '');
      normalized.back = this.convertEditorJsToHtml(raw.back || additional.back || '');
    } else if (type === 'match') {
      normalized.pairs = raw.pairs || additional.pairs || [];
      normalized.theme = raw.theme ?? additional.theme ?? (typeInput.toLowerCase().includes('cloud') ? 'cloud' : 'standard');
      
      const rawMode = raw.matchMode ?? additional.matchMode;
      normalized.allowDragDrop = !!(raw.allowDragDrop ?? additional.allowDragDrop ?? (rawMode !== 'click_match'));
      normalized.allowClickMatch = !!(raw.allowClickMatch ?? additional.allowClickMatch ?? (rawMode !== 'drag_drop'));
      
      normalized.enableAudio = !!(raw.enableAudio ?? additional.enableAudio ?? false);
    } else if (type === 'crossword') {
      normalized.gridSize = raw.gridSize || additional.gridSize || 10;
      normalized.words = raw.words || additional.words || [];
    } else if (type === 'word_arrange') {
      normalized.text = this.convertEditorJsToHtml(raw.text || additional.text || raw.question_text || '');
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
    } else if (type === 'speaking') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.targetText = this.convertEditorJsToHtml(raw.text || additional.targetText || '');
      normalized.imageUrl = raw.media_url || additional.imageUrl || '';
    } else if (type === 'role_play') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.dialogue = raw.dialogue || additional.dialogue || [];
    } else if (type === 'sequencing') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.events = raw.events || additional.events || [];
    } else if (type === 'parts_of_speech') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.text = this.convertEditorJsToHtml(raw.text || raw.question_text || '');
      normalized.parts = raw.parts || additional.parts || [];
    } else if (type === 'mind_map') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.nodes = raw.nodes || additional.nodes || [];
    } else if (type === 'writing') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.text = this.convertEditorJsToHtml(raw.text || additional.text || ''); // hints
      normalized.starterText = raw.starterText || additional.starterText || '';
      normalized.modelAnswer = raw.modelAnswer || additional.modelAnswer || '';
      normalized.minWords = raw.minWords || additional.minWords || 1;
      normalized.maxWords = raw.maxWords || additional.maxWords || 1000;
    } else if (type === 'odd_one_out') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.audioUrl = raw.media_url || additional.audioUrl || '';
      const rawOptions = raw.options || additional.options || [];
      normalized.options = rawOptions.map((opt: any, idx: number) => ({
        id: opt.id ?? idx,
        text: opt.text ?? '',
        isCorrect: !!opt.isCorrect
      }));
    } else if (type === 'letter_basket') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.items = raw.items || additional.items || [];
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

  onSpeakingAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'speaking',
      ...event
    });
  }

  onRolePlayAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'role_play',
      ...event
    });
  }

  onSequencingAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'sequencing',
      ...event
    });
  }

  onPartsOfSpeechAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'parts_of_speech',
      ...event
    });
  }

  onMindMapAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'mind_map',
      ...event
    });
  }

  onWritingAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'writing',
      ...event
    });
  }

  onOddOneOutAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'odd_one_out',
      ...event
    });
  }

  onLetterBasketAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'letter_basket',
      ...event
    });
  }
}