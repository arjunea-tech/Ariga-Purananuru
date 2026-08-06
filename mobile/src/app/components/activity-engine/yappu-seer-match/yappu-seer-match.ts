import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, signal, inject } from '@angular/core';

import { AudioService } from '../../../services/audio.service';
import { Seer, SEERS_2, SEERS_3, ALL_SEERS, getSeersData } from '../yappu-seer-data';
import { ActivityService } from '../../../services/activity.service';

@Component({
  selector: 'app-yappu-seer-match',
  standalone: true,
  imports: [],
  templateUrl: './yappu-seer-match.html',
  styleUrls: ['./yappu-seer-match.css']
})
export class YappuSeerMatchComponent implements OnInit, OnChanges, OnDestroy {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  private audioService = inject(AudioService);

  level = signal<number>(2);
  matchCards = signal<any[]>([]);
  matchFlipped = signal<number[]>([]);
  matchMatched = signal<Set<number>>(new Set());
  matchIncorrect = signal<number[]>([]);
  matchMoves = signal<number>(0);
  matchWon = signal<boolean>(false);

  private activityService = inject(ActivityService);
  seerWords: Record<string, {word: string, hint: string}[]> = {};
  isWordsLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadWords();
  }

  loadWords(): void {
    this.isWordsLoading.set(true);
    this.activityService.getYappuSeerWords().subscribe({
      next: (data) => {
        this.seerWords = data;
        this.isWordsLoading.set(false);
        this.initGame();
      },
      error: (err) => {
        console.error('Failed to load Seer words', err);
        this.isWordsLoading.set(false);
        this.initGame();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.initGame();
    }
  }

  ngOnDestroy(): void {}

  initGame(): void {
    if (this.isWordsLoading()) return;

    const rawLevel = this.activity?.level;
    const parsedLevel = (rawLevel !== undefined && rawLevel !== null && rawLevel !== '') ? Number(rawLevel) : 2;
    this.level.set(isNaN(parsedLevel) ? 2 : parsedLevel);
    this.setupMatchPairs();
  }

  getPool(): Seer[] {
    const l = this.level();
    const data = getSeersData(this.activity);
    return l === 2 ? data.seers_2 : l === 3 ? data.seers_3 : data.all_seers;
  }

  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  setupMatchPairs(): void {
    let pool = this.getPool();
    // Max 10 pairs (20 cards)
    if (pool.length > 10) {
      pool = this.shuffle(pool).slice(0, 10);
    }
    const nameCards = pool.map((s, i) => {
      const wordList = this.seerWords[s.name] && this.seerWords[s.name].length > 0 
        ? this.seerWords[s.name] 
        : [{word: s.name, hint: s.mnemonic}];
      const selectedWord = wordList[Math.floor(Math.random() * wordList.length)];
      return { id: `n${i}`, type: 'name', name: s.name, fruit: s.fruit, pattern: s.pattern, word: selectedWord.word, hint: selectedWord.hint, matchId: i };
    });
    const patternCards = pool.map((s, i) => ({ id: `p${i}`, type: 'pattern', name: s.name, fruit: s.fruit, pattern: s.pattern, matchId: i }));

    this.matchCards.set(this.shuffle([...nameCards, ...patternCards]));
    this.matchFlipped.set([]);
    this.matchMatched.set(new Set());
    this.matchIncorrect.set([]);
    this.matchMoves.set(0);
    this.matchWon.set(false);
  }

  handleCardFlip(idx: number): void {
    const cards = this.matchCards();
    const flipped = this.matchFlipped();
    const matched = this.matchMatched();

    if (this.matchWon() || matched.has(cards[idx].matchId) || flipped.includes(idx) || flipped.length >= 2 || this.matchIncorrect().length > 0) {
      return;
    }

    const next = [...flipped, idx];
    this.matchFlipped.set(next);

    if (next.length === 2) {
      this.matchMoves.update(m => m + 1);
      const [a, b] = next;

      if (cards[a].matchId === cards[b].matchId && cards[a].type !== cards[b].type) {
        // Correct Match
        const nm = new Set(matched);
        nm.add(cards[a].matchId);
        this.matchMatched.set(nm);
        this.audioService.playSuccess();

        if (nm.size === (cards.length / 2)) {
          this.matchWon.set(true);
          this.answered.emit({
            isCorrect: true,
            score: nm.size,
            total: this.matchMoves()
          });
        }
        setTimeout(() => this.matchFlipped.set([]), 400);
      } else {
        // Wrong Match
        this.matchIncorrect.set([a, b]);
        this.audioService.playError();
        setTimeout(() => {
          this.matchFlipped.set([]);
          this.matchIncorrect.set([]);
        }, 800);
      }
    }
  }
}
