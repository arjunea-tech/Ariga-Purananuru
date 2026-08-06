import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';


export interface SequencingData {
  id?: number;
  question?: string;
  events: string[]; // Correct order list, e.g., ["Woke up", "Had breakfast", "Went to school"]
  explanation?: string;
}

interface RenderedEvent {
  text: string;
  originalIndex: number;
}

@Component({
  selector: 'app-activity-sequencing',
  standalone: true,
  imports: [],
  templateUrl: './sequencing.html',
  styleUrls: ['./sequencing.css']
})
export class SequencingComponent implements OnInit, OnChanges {
  @Input() activity: SequencingData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ isCorrect: boolean; orderedEvents: string[] }>();

  scrambledEvents = signal<RenderedEvent[]>([]);
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
    if (!this.activity || !this.activity.events) return;

    // Create objects with original index tracking
    const eventObjects: RenderedEvent[] = this.activity.events.map((e, idx) => ({
      text: e,
      originalIndex: idx
    }));

    // Shuffle until they do not match the correct order (if length > 1)
    let shuffled = this.shuffleArray(eventObjects);
    if (eventObjects.length > 1) {
      let attempts = 0;
      while (attempts < 100 && shuffled.every((item, idx) => item.originalIndex === idx)) {
        shuffled = this.shuffleArray(eventObjects);
        attempts++;
      }
    }

    this.scrambledEvents.set(shuffled);
    this.hasSubmitted.set(false);
    this.isCorrect.set(false);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  moveUp(index: number): void {
    if (this.hasSubmitted() || index <= 0) return;
    
    this.scrambledEvents.update(list => {
      const copy = [...list];
      // Swap with previous item
      [copy[index], copy[index - 1]] = [copy[index - 1], copy[index]];
      return copy;
    });
  }

  moveDown(index: number): void {
    if (this.hasSubmitted()) return;
    
    this.scrambledEvents.update(list => {
      if (index >= list.length - 1) return list;
      const copy = [...list];
      // Swap with next item
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      return copy;
    });
  }

  checkAnswer(): void {
    if (this.hasSubmitted()) return;

    // Check if current order matches the original index order exactly (0, 1, 2...)
    const current = this.scrambledEvents();
    const correct = current.every((item, idx) => item.originalIndex === idx);

    this.isCorrect.set(correct);
    this.hasSubmitted.set(true);

    this.answered.emit({
      isCorrect: correct,
      orderedEvents: current.map(item => item.text)
    });
  }

  reset(): void {
    this.initPuzzle();
  }
}
