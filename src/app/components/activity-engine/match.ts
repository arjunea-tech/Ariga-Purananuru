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
  template: `
    <div class="match-container glass-card">
      <div class="header">
        <span class="badge-tag">Match the Following</span>
      </div>

      <div class="match-grid">
        <!-- Left Column -->
        <div class="column">
          <span class="column-header">English</span>
          @for (item of leftItems(); track item.id) {
            <button
              type="button"
              class="match-btn"
              [class.selected]="selectedLeftId() === item.id"
              [class.matched]="isItemMatched(item.id)"
              [class.incorrect-shake]="shakeLeftId() === item.id"
              [style.background]="getMatchedColorStyle(item.id)"
              [disabled]="isItemMatched(item.id)"
              (click)="selectLeft(item)">
              <span class="item-text">{{ item.text }}</span>
              <span class="badge-check" *ngIf="isItemMatched(item.id)">
                <i class="bi bi-check-circle-fill"></i>
              </span>
            </button>
          }
        </div>

        <!-- Right Column -->
        <div class="column">
          <span class="column-header">Tamil</span>
          @for (item of rightItems(); track item.id) {
            <button
              type="button"
              class="match-btn"
              [class.selected]="selectedRightId() === item.id"
              [class.matched]="isItemMatched(item.id)"
              [class.incorrect-shake]="shakeRightId() === item.id"
              [style.background]="getMatchedColorStyle(item.id)"
              [disabled]="isItemMatched(item.id)"
              (click)="selectRight(item)">
              <span class="item-text">{{ item.text }}</span>
              <span class="badge-check" *ngIf="isItemMatched(item.id)">
                <i class="bi bi-check-circle-fill"></i>
              </span>
            </button>
          }
        </div>
      </div>

      <!-- Explanation Box -->
      @if (showFeedback && isComplete() && activity?.explanation) {
        <div class="explanation-box animate-fade-in">
          <div class="explanation-title">
            <i class="bi bi-info-circle-fill"></i>
            <span>Explanation</span>
          </div>
          <p class="explanation-text">{{ activity?.explanation }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08);
      border-radius: 1.25rem;
      padding: 2rem;
      transition: all 0.3s ease;
    }
    .match-container {
      margin-bottom: 1.5rem;
      width: 100%;
    }
    .header {
      margin-bottom: 1.5rem;
    }
    .badge-tag {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 50px;
      text-uppercase: uppercase;
      letter-spacing: 0.05em;
      display: inline-block;
    }
    .match-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 1rem;
    }
    @media (max-width: 576px) {
      .match-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }
    .column {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .column-header {
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 0.25rem;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 0.5rem;
    }
    .match-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: rgba(255, 255, 255, 0.9);
      border: 1.5px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.9rem 1.25rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .match-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      border-color: #8b5cf6;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
    }
    .match-btn.selected {
      border-color: #8b5cf6;
      background: rgba(139, 92, 246, 0.05) !important;
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
    }
    .match-btn.matched {
      cursor: not-allowed;
      border-color: transparent !important;
      color: #1e293b;
      font-weight: 600;
    }
    .item-text {
      font-weight: 500;
      color: #334155;
    }
    .match-btn.matched .item-text {
      color: #1e293b;
      font-weight: 600;
    }
    .badge-check {
      color: #10b981;
      font-size: 1.15rem;
      display: flex;
      align-items: center;
    }
    
    /* Lock pair colors styling (distinct premium pastel glass colors) */
    .color-pair-0 { background: rgba(59, 130, 246, 0.15) !important; border: 1.5px solid #3b82f6 !important; }
    .color-pair-1 { background: rgba(16, 185, 129, 0.15) !important; border: 1.5px solid #10b981 !important; }
    .color-pair-2 { background: rgba(245, 158, 11, 0.15) !important; border: 1.5px solid #f59e0b !important; }
    .color-pair-3 { background: rgba(236, 72, 153, 0.15) !important; border: 1.5px solid #ec4899 !important; }
    .color-pair-4 { background: rgba(139, 92, 246, 0.15) !important; border: 1.5px solid #8b5cf6 !important; }
    .color-pair-5 { background: rgba(20, 184, 166, 0.15) !important; border: 1.5px solid #14b8a6 !important; }

    /* Shakes & Animations */
    @keyframes horizontal-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      50% { transform: translateX(5px); }
      75% { transform: translateX(-5px); }
    }
    .incorrect-shake {
      animation: horizontal-shake 0.3s ease-in-out;
      border-color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.08) !important;
    }
    
    .explanation-box {
      margin-top: 1.5rem;
      background: rgba(245, 158, 11, 0.08);
      border-left: 4px solid #f59e0b;
      border-radius: 0.5rem;
      padding: 1.25rem;
    }
    .explanation-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #d97706;
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    .explanation-text {
      color: #451a03;
      margin: 0;
      font-size: 0.925rem;
      line-height: 1.5;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
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
