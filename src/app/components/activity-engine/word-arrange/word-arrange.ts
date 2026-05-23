import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WordArrangeData {
  type: string;
  question?: string;
  text: string;
  explanation?: string;
}

@Component({
  selector: 'app-activity-word-arrange',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './word-arrange.html',
  styleUrls: ['./word-arrange.css']
})
export class WordArrangeComponent implements OnInit, OnChanges {
  @Input() activity: WordArrangeData | null = null;
  @Input() showFeedback: boolean = true;
  @Output() answered = new EventEmitter<any>();

  originalWords = signal<string[]>([]);
  shuffledWords = signal<{ id: number; text: string; isUsed: boolean }[]>([]);
  arrangedWords = signal<{ id: number; text: string }[]>([]);
  hasSubmitted = signal<boolean>(false);
  isCorrect = signal<boolean>(false);

  ngOnInit(): void {
    this.initPuzzle();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.initPuzzle();
    }
  }

  initPuzzle(): void {
    if (!this.activity) return;
    let text = this.activity.text || '';
    let words: string[] = [];

    if (text.includes('/')) {
      words = text.split('/').map(w => w.trim()).filter(Boolean);
    } else {
      words = text.split(/\s+/).map(w => w.trim()).filter(Boolean);
    }

    this.originalWords.set([...words]);

    const wordObjects = words.map((w, idx) => ({
      id: idx,
      text: w,
      isUsed: false
    }));

    // Shuffle algorithm
    for (let i = wordObjects.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wordObjects[i], wordObjects[j]] = [wordObjects[j], wordObjects[i]];
    }

    this.shuffledWords.set(wordObjects);
    this.arrangedWords.set([]);
    this.hasSubmitted.set(false);
    this.isCorrect.set(false);
  }

  selectWord(wordObj: { id: number; text: string; isUsed: boolean }): void {
    if (wordObj.isUsed || this.hasSubmitted()) return;

    this.shuffledWords.update(words => 
      words.map(w => w.id === wordObj.id ? { ...w, isUsed: true } : w)
    );

    this.arrangedWords.update(arr => [...arr, { id: wordObj.id, text: wordObj.text }]);
  }

  deselectWord(wordObj: { id: number; text: string }): void {
    if (this.hasSubmitted()) return;

    this.arrangedWords.update(arr => arr.filter(w => w.id !== wordObj.id));

    this.shuffledWords.update(words => 
      words.map(w => w.id === wordObj.id ? { ...w, isUsed: false } : w)
    );
  }

  isAnyWordArranged(): boolean {
    return this.arrangedWords().length > 0;
  }

  checkAnswers(): void {
    if (this.hasSubmitted()) return;

    const userSentence = this.arrangedWords().map(w => w.text).join(' ').toLowerCase();
    const correctSentence = this.originalWords().join(' ').toLowerCase();

    const correct = userSentence === correctSentence;
    this.isCorrect.set(correct);
    this.hasSubmitted.set(true);

    this.answered.emit({
      isCorrect: correct,
      answer: userSentence
    });
  }

  resetPuzzle(): void {
    this.initPuzzle();
  }
}