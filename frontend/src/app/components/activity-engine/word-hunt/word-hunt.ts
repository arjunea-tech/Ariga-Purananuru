import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';


export interface HuntBox {
  text: string;
  isCorrect: boolean;
}

export interface WordHuntData {
  id?: number;
  question: string;
  gridSize: number; // 2, 3, 4, 5
  boxes: HuntBox[];
  explanation?: string;
}

const KURIL_LETTERS = ['அ', 'இ', 'உ', 'எ', 'ஒ', 'க', 'கி', 'கு', 'கெ', 'கொ', 'ச', 'சி', 'சு', 'செ', 'சொ', 'த', 'தி', 'து', 'தெ', 'தொ', 'ப', 'பி', 'பு', 'பெ', 'பொ', 'ம', 'மி', 'மு', 'மெ', 'மொ', 'வ', 'வி', 'வு', 'வெ', 'வொ', 'ட', 'டி', 'டு', 'டெ', 'டொ', 'ந', 'நி', 'நு', 'நெ', 'நொ', 'ல', 'லி', 'லு', 'லெ', 'லொ', 'ர', 'ரி', 'ரு', 'ரெ', 'ரொ'];
const NEDIL_LETTERS = ['ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஐ', 'ஓ', 'ஔ', 'கா', 'கீ', 'கூ', 'கே', 'கை', 'கோ', 'கௌ', 'சா', 'சீ', 'சூ', 'சே', 'சை', 'சோ', 'சௌ', 'தா', 'தீ', 'தூ', 'தே', 'தை', 'தோ', 'தௌ', 'பா', 'பீ', 'பூ', 'பே', 'பை', 'போ', 'பௌ', 'மா', 'மீ', 'மூ', 'மே', 'மை', 'மோ', 'மௌ', 'டா', 'டீ', 'டூ', 'டே', 'டை', 'டோ', 'டௌ', 'நா', 'நீ', 'நூ', 'நே', 'நை', 'நோ', 'நௌ', 'லா', 'லீ', 'லூ', 'லே', 'லை', 'லோ', 'லௌ', 'ரா', 'ரீ', 'ரூ', 'ரே', 'ரை', 'ரோ', 'ரௌ'];
const MEI_LETTERS = ['க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'];
const OTTRU_LETTERS = ['க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்', 'ஃ'];

@Component({
  selector: 'app-activity-word-hunt',
  standalone: true,
  imports: [],
  templateUrl: './word-hunt.html',
  styleUrls: ['./word-hunt.css']
})
export class WordHuntComponent implements OnChanges {
  @Input() activity: WordHuntData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ isCorrect: boolean }>();

  selectedIndices = signal<Set<number>>(new Set());
  hasSubmitted = signal<boolean>(false);
  isAnswerCorrect = signal<boolean>(false);
  dynamicBoxes = signal<HuntBox[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.reset();
    }
  }

  toggleSelect(idx: number): void {
    if (this.hasSubmitted() && this.showFeedback) return;

    const current = new Set(this.selectedIndices());
    if (current.has(idx)) {
      current.delete(idx);
    } else {
      current.add(idx);
    }
    this.selectedIndices.set(current);
  }

  checkAnswers(): void {
    if (!this.activity || this.hasSubmitted()) return;

    const selected = this.selectedIndices();
    const boxes = this.dynamicBoxes();

    // Verify correctness:
    // Every selected box must be correct, and every correct box must be selected.
    let correct = true;
    boxes.forEach((box, idx) => {
      const isSel = selected.has(idx);
      if (box.isCorrect !== isSel) {
        correct = false;
      }
    });

    this.isAnswerCorrect.set(correct);
    this.hasSubmitted.set(true);

    this.answered.emit({
      isCorrect: correct
    });
  }

  reset(): void {
    this.selectedIndices.set(new Set());
    this.hasSubmitted.set(false);
    this.isAnswerCorrect.set(false);

    if (this.activity) {
      // If there are no boxes or all boxes have empty/blank text, treat as empty and generate dynamically
      const allBoxesEmpty = !this.activity.boxes || 
                            this.activity.boxes.length === 0 || 
                            this.activity.boxes.every(box => !box.text || box.text.trim() === '');

      if (!allBoxesEmpty) {
        this.dynamicBoxes.set(JSON.parse(JSON.stringify(this.activity.boxes)));
      } else {
        this.generateDynamicGrid();
      }
    }
  }

  private generateDynamicGrid(): void {
    if (!this.activity) return;

    const gridSize = this.activity.gridSize || 2;
    const totalCells = gridSize * gridSize;
    const question = this.activity.question || '';

    // Detect target category from question text
    let targetCategory = 'குறில்';
    if (question.includes('நெடில்')) {
      targetCategory = 'நெடில்';
    } else if (question.includes('மெய்')) {
      targetCategory = 'மெய்';
    } else if (question.includes('ஒற்று')) {
      targetCategory = 'ஒற்று';
    }

    let correctPool: string[] = [];
    let incorrectPool: string[] = [];

    if (targetCategory === 'குறில்') {
      correctPool = KURIL_LETTERS;
      incorrectPool = [...NEDIL_LETTERS, ...MEI_LETTERS, ...OTTRU_LETTERS];
    } else if (targetCategory === 'நெடில்') {
      correctPool = NEDIL_LETTERS;
      incorrectPool = [...KURIL_LETTERS, ...MEI_LETTERS, ...OTTRU_LETTERS];
    } else if (targetCategory === 'மெய்') {
      correctPool = MEI_LETTERS;
      incorrectPool = [...KURIL_LETTERS, ...NEDIL_LETTERS];
    } else if (targetCategory === 'ஒற்று') {
      correctPool = OTTRU_LETTERS;
      incorrectPool = [...KURIL_LETTERS, ...NEDIL_LETTERS];
    }

    if (correctPool.length === 0) correctPool = ['அ'];
    if (incorrectPool.length === 0) incorrectPool = ['ஆ'];

    // Select dynamic mix of correct/incorrect boxes
    const numCorrect = Math.max(1, Math.floor(totalCells * 0.45));
    const numIncorrect = totalCells - numCorrect;

    const selectedBoxes: HuntBox[] = [];

    const shuffledCorrect = this.shuffleArray([...correctPool]);
    for (let i = 0; i < numCorrect; i++) {
      selectedBoxes.push({
        text: shuffledCorrect[i % shuffledCorrect.length],
        isCorrect: true
      });
    }

    const shuffledIncorrect = this.shuffleArray([...incorrectPool]);
    for (let i = 0; i < numIncorrect; i++) {
      selectedBoxes.push({
        text: shuffledIncorrect[i % shuffledIncorrect.length],
        isCorrect: false
      });
    }

    this.dynamicBoxes.set(this.shuffleArray(selectedBoxes));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
