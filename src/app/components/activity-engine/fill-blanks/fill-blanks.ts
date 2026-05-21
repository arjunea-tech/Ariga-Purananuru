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
  templateUrl: './fill-blanks.html',
  styleUrls: ['./fill-blanks.css']
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
