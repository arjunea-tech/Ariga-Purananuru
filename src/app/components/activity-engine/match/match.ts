import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MatchPair {
  left: string;
  right: string;
}

export interface MatchData {
  id?: number;
  pairs: MatchPair[];
  explanation?: string;
}

interface ShuffledItem {
  id: string; // "left-0", "right-2", etc.
  text: string;
  originalIndex: number;
}

interface MatchedPair {
  leftId: string;
  rightId: string;
  colorClass: string;
}

@Component({
  selector: 'app-activity-match',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match.html',
  styleUrls: ['./match.css']
})
export class MatchComponent implements OnInit {
  @Input() activity: MatchData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ isCorrect: boolean }>();

  leftItems = signal<ShuffledItem[]>([]);
  rightItems = signal<ShuffledItem[]>([]);

  selectedLeftId = signal<string | null>(null);
  selectedRightId = signal<string | null>(null);

  matchedPairs = signal<MatchedPair[]>([]);
  
  shakeLeftId = signal<string | null>(null);
  shakeRightId = signal<string | null>(null);

  isComplete = signal<boolean>(false);

  // Curated pastel glass colors for matched connections
  private pastelColors = [
    'rgba(59, 130, 246, 0.15)',  // Blue
    'rgba(16, 185, 129, 0.15)',  // Emerald
    'rgba(245, 158, 11, 0.15)',   // Amber
    'rgba(236, 72, 153, 0.15)',  // Pink
    'rgba(139, 92, 246, 0.15)',  // Purple
    'rgba(20, 184, 166, 0.15)',   // Teal
  ];

  private borderColors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#14b8a6'
  ];

  ngOnInit(): void {
    this.initializeMatchGame();
  }

  initializeMatchGame(): void {
    if (!this.activity || !this.activity.pairs) return;

    const left: ShuffledItem[] = [];
    const right: ShuffledItem[] = [];

    this.activity.pairs.forEach((pair, idx) => {
      left.push({
        id: `left-${idx}`,
        text: pair.left,
        originalIndex: idx
      });
      right.push({
        id: `right-${idx}`,
        text: pair.right,
        originalIndex: idx
      });
    });

    // Shuffle separately
    this.leftItems.set(this.shuffleArray(left));
    this.rightItems.set(this.shuffleArray(right));
    this.matchedPairs.set([]);
    this.isComplete.set(false);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  selectLeft(item: ShuffledItem): void {
    if (this.isItemMatched(item.id)) return;
    this.selectedLeftId.set(item.id);
    this.checkMatch();
  }

  selectRight(item: ShuffledItem): void {
    if (this.isItemMatched(item.id)) return;
    this.selectedRightId.set(item.id);
    this.checkMatch();
  }

  checkMatch(): void {
    const leftId = this.selectedLeftId();
    const rightId = this.selectedRightId();

    if (!leftId || !rightId) return;

    // Resolve index
    const leftItem = this.leftItems().find(i => i.id === leftId);
    const rightItem = this.rightItems().find(i => i.id === rightId);

    if (leftItem && rightItem) {
      if (leftItem.originalIndex === rightItem.originalIndex) {
        // MATCH DETECTED!
        const nextColorIdx = this.matchedPairs().length % this.pastelColors.length;
        
        this.matchedPairs.update(pairs => [
          ...pairs,
          { leftId, rightId, colorClass: `color-pair-${nextColorIdx}` }
        ]);

        this.selectedLeftId.set(null);
        this.selectedRightId.set(null);

        // Check if all matched
        if (this.matchedPairs().length === this.activity?.pairs.length) {
          this.isComplete.set(true);
          this.answered.emit({ isCorrect: true });
        }
      } else {
        // MISMATCH!
        this.shakeLeftId.set(leftId);
        this.shakeRightId.set(rightId);

        // Reset shake after duration
        const currentLeft = leftId;
        const currentRight = rightId;
        setTimeout(() => {
          if (this.shakeLeftId() === currentLeft) this.shakeLeftId.set(null);
          if (this.shakeRightId() === currentRight) this.shakeRightId.set(null);
          
          this.selectedLeftId.set(null);
          this.selectedRightId.set(null);
        }, 3000);
      }
    }
  }

  isItemMatched(itemId: string): boolean {
    return this.matchedPairs().some(p => p.leftId === itemId || p.rightId === itemId);
  }

  getMatchedColorStyle(itemId: string): string {
    const pair = this.matchedPairs().find(p => p.leftId === itemId || p.rightId === itemId);
    if (!pair) return '';

    // Extract index from pair.colorClass ("color-pair-X")
    const index = parseInt(pair.colorClass.replace('color-pair-', ''), 10);
    const bgColor = this.pastelColors[index];
    const borderColor = this.borderColors[index];
    
    return bgColor;
  }

  reset(): void {
    this.selectedLeftId.set(null);
    this.selectedRightId.set(null);
    this.initializeMatchGame();
  }
}
