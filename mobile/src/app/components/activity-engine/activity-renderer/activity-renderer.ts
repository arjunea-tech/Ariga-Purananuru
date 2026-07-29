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
import { WordHuntComponent, WordHuntData } from '../word-hunt/word-hunt';
import { LetterBasketComponent, LetterBasketData } from '../letter-basket/letter-basket';
import { BalloonPopComponent, BalloonPopData } from '../balloon-pop/balloon-pop';
import { WordBuilderComponent, WordBuilderData } from '../word-builder/word-builder';
import { YappuFlashcardComponent } from '../yappu-flashcard/yappu-flashcard';
import { YappuSeerComponent } from '../yappu-seer/yappu-seer';
import { YappuSeerP2nComponent } from '../yappu-seer-p2n/yappu-seer-p2n';
import { YappuSeerN2pComponent } from '../yappu-seer-n2p/yappu-seer-n2p';
import { YappuSeerBuildComponent } from '../yappu-seer-build/yappu-seer-build';
import { YappuSeerSpeedComponent } from '../yappu-seer-speed/yappu-seer-speed';
import { YappuSeerMatchComponent } from '../yappu-seer-match/yappu-seer-match';
import { YappuAsaiSliceComponent } from '../yappu-asai-slice/yappu-asai-slice';
import { YappuAsaiDetectiveComponent } from '../yappu-asai-detective/yappu-asai-detective';
import { YappuThalaiComponent } from '../yappu-thalai/yappu-thalai';
import { YappuKuralPuzzleComponent } from '../yappu-kural-puzzle/yappu-kural-puzzle';
import { YappuEetruSeerComponent } from '../yappu-eetru-seer/yappu-eetru-seer';

export interface NormalizedActivity {
  type: 'mcq' | 'fill_blanks' | 'flashcard' | 'match' | 'crossword' | 'word_arrange' | 'speaking' | 'role_play' | 'sequencing' | 'parts_of_speech' | 'mind_map' | 'writing' | 'odd_one_out' | 'word_hunt' | 'letter_basket' | 'balloon_pop' | 'word_builder' | 'yappu_flashcard' | 'yappu_seer' | 'yappu_seer_p2n' | 'yappu_seer_n2p' | 'yappu_seer_build' | 'yappu_seer_speed' | 'yappu_seer_match' | 'yappu_asai_slice' | 'yappu_asai_detective' | 'yappu_thalai' | 'yappu_kural_puzzle' | 'yappu_eetru_seer';
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
  boxes?: any[];
  items?: any[];
  syllableCount?: number;
  level?: number;
  target?: 'ner' | 'nirai';
  timer?: number;
  nerWords?: string[];
  niraiWords?: string[];
  challenges?: any[];
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
    WordHuntComponent,
    LetterBasketComponent,
    BalloonPopComponent,
    WordBuilderComponent,
    YappuFlashcardComponent,
    YappuSeerComponent,
    YappuSeerP2nComponent,
    YappuSeerN2pComponent,
    YappuSeerBuildComponent,
    YappuSeerSpeedComponent,
    YappuSeerMatchComponent,
    YappuAsaiSliceComponent,
    YappuAsaiDetectiveComponent,
    YappuThalaiComponent,
    YappuKuralPuzzleComponent,
    YappuEetruSeerComponent
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
    let type: NormalizedActivity['type'] = 'mcq';

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
    } else if (['word_hunt', 'word-hunt', 'wordhunt', 'letter_hunt', 'letter-hunt'].includes(typeInput.toLowerCase())) {
      type = 'word_hunt';
    } else if (['letter_basket', 'letter-basket', 'letterbasket'].includes(typeInput.toLowerCase())) {
      type = 'letter_basket';
    } else if (['balloon_pop', 'balloon-pop', 'balloonpop'].includes(typeInput.toLowerCase())) {
      type = 'balloon_pop';
    } else if (['word_builder', 'word-builder', 'wordbuilder'].includes(typeInput.toLowerCase())) {
      type = 'word_builder';
    } else if (['yappu_flashcard', 'yappu-flashcard', 'yappuflashcard', 'flashcard_yappu'].includes(typeInput.toLowerCase())) {
      type = 'yappu_flashcard';
    } else if (['yappu_seer', 'yappu-seer', 'seer_game', 'seer-game'].includes(typeInput.toLowerCase())) {
      type = 'yappu_seer';
    } else if (typeInput.toLowerCase() === 'yappu_seer_p2n') {
      type = 'yappu_seer_p2n';
    } else if (typeInput.toLowerCase() === 'yappu_seer_n2p') {
      type = 'yappu_seer_n2p';
    } else if (typeInput.toLowerCase() === 'yappu_seer_build') {
      type = 'yappu_seer_build';
    } else if (typeInput.toLowerCase() === 'yappu_seer_speed') {
      type = 'yappu_seer_speed';
    } else if (typeInput.toLowerCase() === 'yappu_seer_match') {
      type = 'yappu_seer_match';
    } else if (['yappu_asai_slice', 'yappu-asai-slice'].includes(typeInput.toLowerCase())) {
      type = 'yappu_asai_slice';
    } else if (['yappu_asai_detective', 'yappu-asai-detective'].includes(typeInput.toLowerCase())) {
      type = 'yappu_asai_detective';
    } else if (['yappu_thalai', 'yappu-thalai', 'thalai_game', 'thalai-game'].includes(typeInput.toLowerCase())) {
      type = 'yappu_thalai';
    } else if (['yappu_kural_puzzle', 'yappu-kural-puzzle', 'kural_puzzle', 'kural-puzzle'].includes(typeInput.toLowerCase())) {
      type = 'yappu_kural_puzzle';
    } else if (['yappu_eetru_seer', 'yappu-eetru-seer', 'eetru_seer', 'eetru-seer'].includes(typeInput.toLowerCase())) {
      type = 'yappu_eetru_seer';
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
      const mappedOptions = rawOptions.map((opt: any, idx: number) => ({
        id: opt.id ?? idx,
        text: opt.option_text ?? opt.text ?? '',
        isCorrect: !!(opt.is_correct ?? opt.isCorrect ?? false)
      }));
      // Shuffle options for MCQ (Requirement: Option Shuffling)
      normalized.options = this.shuffleArray(mappedOptions);
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
    } else if (type === 'word_hunt') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.gridSize = raw.gridSize || additional.gridSize || 2;
      normalized.boxes = raw.boxes || additional.boxes || [];
    } else if (type === 'letter_basket') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.items = raw.items || additional.items || [];
    } else if (type === 'balloon_pop') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.level = raw.level || additional.level || 1;
      normalized.target = raw.target || additional.target || 'ner';
      normalized.timer = raw.timer || additional.timer || 30;
      // Pass through custom word lists if provided (dynamic mode)
      normalized.nerWords = raw.nerWords || additional.nerWords || [];
      normalized.niraiWords = raw.niraiWords || additional.niraiWords || [];
    } else if (type === 'word_builder') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.text = raw.text || raw.question_text || '';
    } else if (type === 'yappu_flashcard') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.text = raw.text || raw.question_text || '';
      normalized.syllableCount = raw.syllableCount || additional.syllableCount || 1;
    } else if (type === 'yappu_seer' || type.startsWith('yappu_seer_')) {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.level = raw.level || additional.level || 2;
    } else if (type === 'yappu_asai_slice') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.words = raw.words || additional.words || [];
    } else if (type === 'yappu_asai_detective') {
      normalized.question = this.convertEditorJsToHtml(raw.question || raw.question_text || '');
      normalized.challenges = raw.challenges || additional.challenges || [];
      normalized.words = raw.words || additional.words || [];
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

  onWordHuntAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'word_hunt',
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

  onBalloonPopAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'balloon_pop',
      ...event
    });
  }

  onWordBuilderAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'word_builder',
      ...event
    });
  }

  onYappuFlashcardAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'yappu_flashcard',
      ...event
    });
  }

  onYappuSeerAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: this.activity?.type || 'yappu_seer',
      ...event
    });
  }

  onYappuEetruSeerAnswered(event: any): void {
    this.answered.emit({
      questionId: this.activity?.id,
      type: 'yappu_eetru_seer',
      ...event
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}