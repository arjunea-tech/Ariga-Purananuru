import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FlashcardData {
  id?: number;
  front: string; // Foreign word, e.g. "வணக்கம்"
  back: string;  // Translation, e.g. "Hello / Greetings"
  langCode?: string; // Language code for TTS, e.g., 'ta-IN' or 'en-US'
  audioUrl?: string; // Optional audio URL override
}

@Component({
  selector: 'app-activity-flashcard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flashcard.html',
  styleUrls: ['./flashcard.css']
})
export class FlashcardComponent implements OnChanges {
  @Input() activity: FlashcardData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ studyAgain: boolean; correct: boolean }>();

  isFlipped = signal<boolean>(false);
  studyLogged = signal<boolean>(false);
  loggedAgain = signal<boolean>(false);

  flipCard(): void {
    this.isFlipped.update(v => !v);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.reset();
    }
  }
  speakWord(event: Event): void {
    event.stopPropagation(); // Avoid flipping card
    if (!this.activity || !this.activity.front) return;

    // Use SpeechSynthesis
    const utter = new SpeechSynthesisUtterance(this.activity.front);
    if (this.activity.langCode) {
      utter.lang = this.activity.langCode;
    } else {
      // Auto detect or default to Tamil/English
      utter.lang = 'en-US';
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  logFeedback(studyAgain: boolean): void {
    this.studyLogged.set(true);
    this.loggedAgain.set(studyAgain);
    this.answered.emit({
      studyAgain,
      correct: !studyAgain
    });

    // Auto reset notification after a short delay
    setTimeout(() => {
      this.studyLogged.set(false);
    }, 2000);
  }

  reset(): void {
    this.isFlipped.set(false);
    this.studyLogged.set(false);
  }
}
