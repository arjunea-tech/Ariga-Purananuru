import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FillBlanksData {
  id?: number;
  text: string; // "The [cat] is on the [mat]."
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
}

interface Segment {
  type: 'text' | 'blank' | 'dropdown';
  value: string; // Text content or correct answer
  options?: string[]; // Options for dropdown
  blankIndex?: number;
}

@Component({
  selector: 'app-activity-fill-blanks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fill-blanks.html',
  styleUrls: ['./fill-blanks.css']
})
export class FillBlanksComponent implements OnInit, OnChanges {
  @Input() activity: FillBlanksData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ answers: string[]; isCorrect: boolean }>();

  segments: Segment[] = [];
  userAnswers = signal<string[]>([]);
  hasSubmitted = signal<boolean>(false);
  isPlaying = signal<boolean>(false);
  private currentAudio: HTMLAudioElement | null = null;

  ngOnInit(): void {
    this.parseSentence();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.parseSentence();
    }
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

      // Check if dropdown or normal blank
      let segmentType: 'blank' | 'dropdown' = 'blank';
      let dropdownOptions: string[] = [];
      let correctVal = answerValue;

      if (answerValue.includes('|') || answerValue.includes('/')) {
        segmentType = 'dropdown';
        dropdownOptions = answerValue.split(/[|\/]/).map(o => o.trim()).filter(Boolean);
        correctVal = dropdownOptions[0]; // first option is correct
      }

      // Add blank or dropdown segment
      tempSegments.push({
        type: segmentType,
        value: correctVal,
        options: dropdownOptions,
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
    const blank = this.segments.find(s => (s.type === 'blank' || s.type === 'dropdown') && s.blankIndex === blankIndex);
    if (!blank) return false;
    const correct = blank.value.trim().toLowerCase();
    const user = (this.userAnswers()[blankIndex] || '').trim().toLowerCase();
    return correct === user;
  }

  playAudio(): void {
    if (!this.activity || !this.activity.audioUrl) return;

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.isPlaying.set(false);
      this.currentAudio = null;
      return;
    }

    this.isPlaying.set(true);
    this.currentAudio = new Audio(this.activity.audioUrl);
    this.currentAudio.onended = () => {
      this.isPlaying.set(false);
      this.currentAudio = null;
    };
    this.currentAudio.onerror = () => {
      this.isPlaying.set(false);
      this.currentAudio = null;
    };
    this.currentAudio.play().catch(err => {
      console.error(err);
      this.isPlaying.set(false);
      this.currentAudio = null;
    });
  }

  checkAnswers(): void {
    if (this.hasSubmitted()) return;

    this.hasSubmitted.set(true);
    this.emitProgress();
  }

  emitProgress(): void {
    const answersList = this.userAnswers();
    const blanks = this.segments.filter(s => s.type === 'blank' || s.type === 'dropdown');
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
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.isPlaying.set(false);
  }
}
