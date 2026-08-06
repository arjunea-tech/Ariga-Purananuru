import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';

export interface WritingData {
  id?: number;
  question?: string;
  text?: string; // Optional prompt passage or hints list
  starterText?: string; // Optional opening sentence/phrase
  modelAnswer?: string; // Correct/model response preview for feedback
  minWords?: number;
  maxWords?: number;
  explanation?: string;
}

@Component({
  selector: 'app-activity-writing',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './writing.html',
  styleUrls: ['./writing.css']
})
export class WritingComponent implements OnInit, OnChanges {
  @Input() activity: WritingData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ isCorrect: boolean; text: string; wordCount: number }>();

  userText = signal<string>('');
  hasSubmitted = signal<boolean>(false);

  wordCount = computed(() => {
    const text = this.userText().trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  });

  charCount = computed(() => {
    return this.userText().length;
  });

  ngOnInit(): void {
    this.initWriting();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.initWriting();
    }
  }

  initWriting(): void {
    this.userText.set(this.activity?.starterText || '');
    this.hasSubmitted.set(false);
  }

  isValidLength(): boolean {
    const count = this.wordCount();
    const min = this.activity?.minWords || 1;
    const max = this.activity?.maxWords || 1000;
    return count >= min && count <= max;
  }

  submitWriting(): void {
    if (this.hasSubmitted() || !this.isValidLength()) return;

    this.hasSubmitted.set(true);

    this.answered.emit({
      isCorrect: true, // Completion counts as passing
      text: this.userText(),
      wordCount: this.wordCount()
    });
  }

  reset(): void {
    this.initWriting();
  }
}