import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MCQOption {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface MCQData {
  id?: number;
  question: string;
  options: MCQOption[];
  explanation?: string;
  audioUrl?: string;
}

@Component({
  selector: 'app-activity-mcq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mcq.html',
  styleUrls: ['./mcq.css']
})
export class MCQComponent {
  @Input() activity: MCQData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ selectedOptionId: number; isCorrect: boolean }>();

  selectedOptionId = signal<number | null>(null);
  hasSubmitted = signal<boolean>(false);
  isPlaying = signal<boolean>(false);
  private currentAudio: HTMLAudioElement | null = null;

  selectOption(option: MCQOption): void {
    if (this.showFeedback && this.hasSubmitted()) return;

    this.selectedOptionId.set(option.id);
    
    if (this.showFeedback) {
      this.hasSubmitted.set(true);
    }

    this.answered.emit({
      selectedOptionId: option.id,
      isCorrect: option.isCorrect
    });
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
      console.error('Audio playback failed:', err);
      this.isPlaying.set(false);
      this.currentAudio = null;
    });
  }

  getLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  reset(): void {
    this.selectedOptionId.set(null);
    this.hasSubmitted.set(false);
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.isPlaying.set(false);
  }
}
