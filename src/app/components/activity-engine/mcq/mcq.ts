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

  getLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  reset(): void {
    this.selectedOptionId.set(null);
    this.hasSubmitted.set(false);
  }
}
