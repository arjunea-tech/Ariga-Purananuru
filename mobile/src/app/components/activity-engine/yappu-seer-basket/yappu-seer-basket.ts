import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';
import { Seer, getSeersData } from '../yappu-seer-data';

import { ActivityService } from '../../../services/activity.service';

export interface FallingItem {
  id: number;
  seer: Seer;
  word: string;
  hint: string;
  yPosition: number;
  isCaught: boolean;
  basketType: string | null;
}

@Component({
  selector: 'app-yappu-seer-basket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './yappu-seer-basket.html',
  styleUrls: ['./yappu-seer-basket.css']
})
export class YappuSeerBasketComponent implements OnInit, OnChanges, OnDestroy {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  private audioService = inject(AudioService);
  private activityService = inject(ActivityService);

  seerWords: Record<string, { word: string, hint: string }[]> = {};
  isWordsLoading = signal<boolean>(true);

  level = signal<number>(0);
  score = signal<number>(0);
  total = signal<number>(0);
  lives = signal<number>(3);
  isGameOver = signal<boolean>(false);
  gameWon = signal<boolean>(false);
  isWrong = signal<boolean>(false);
  showPlusOne = signal<string | null>(null);

  currentItem = signal<FallingItem | null>(null);

  baskets = [
    { id: 'மாச்சீர்', name: 'மாச்சீர்', color: '#10B981', icon: 'bi-basket2-fill' },
    { id: 'விளச்சீர்', name: 'விளச்சீர்', color: '#3B82F6', icon: 'bi-basket2-fill' },
    { id: 'காய்ச்சீர்', name: 'காய்ச்சீர்', color: '#F59E0B', icon: 'bi-basket2-fill' },
    { id: 'கனிச்சீர்', name: 'கனிச்சீர்', color: '#EF4444', icon: 'bi-basket2-fill' }
  ];

  // Dynamically show baskets based on the current level
  get visibleBaskets() {
    const l = this.level();
    if (l === 1 || l === 2) {
      // Level 2 (2 Asai): Only 2 baskets (மாச்சீர் & விளச்சீர்)
      return this.baskets.filter(b => b.id === 'மாச்சீர்' || b.id === 'விளச்சீர்');
    } else if (l === 3) {
      // Level 3 (3 Asai): Only 2 baskets (காய்ச்சீர் & கனிச்சீர்)
      return this.baskets.filter(b => b.id === 'காய்ச்சீர்' || b.id === 'கனிச்சீர்');
    } else {
      // Level 0 (All): Show all 4 baskets
      return this.baskets;
    }
  }

  private gameLoopInterval: any;
  private fallSpeed = 0.5; // percent per tick
  private tickRate = 30; // ms per tick

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
        // Fallback or just set loading false
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

  ngOnDestroy(): void {
    this.stopGameLoop();
  }

  initGame(): void {
    if (this.isWordsLoading()) return;

    this.stopGameLoop();
    const rawLevel = this.activity?.level;
    const parsedLevel = (rawLevel !== undefined && rawLevel !== null && rawLevel !== '') ? Number(rawLevel) : 0;
    this.level.set(isNaN(parsedLevel) ? 0 : parsedLevel);

    this.score.set(0);
    this.total.set(0);
    this.lives.set(3);
    this.isGameOver.set(false);
    this.gameWon.set(false);
    this.fallSpeed = 0.4; // Faster starting speed (was 0.3)

    this.spawnNextItem();
    this.startGameLoop();
  }

  getPool(): Seer[] {
    const l = this.level();
    const data = getSeersData(this.activity);
    if (l === 1 || l === 2) return data.seers_2;
    if (l === 3) return data.seers_3;
    return data.all_seers;
  }

  getExpectedBasket(seer: Seer): string {
    const name = seer.name;
    if (name.endsWith('மா')) return 'மாச்சீர்';
    if (name.endsWith('விளம்')) return 'விளச்சீர்';
    if (name.endsWith('காய்')) return 'காய்ச்சீர்';
    if (name.endsWith('கனி')) return 'கனிச்சீர்';
    return 'மாச்சீர்';
  }

  spawnNextItem(): void {
    const pool = this.getPool();
    if (pool.length === 0) return;

    // Pick a random seer
    const q = pool[Math.floor(Math.random() * pool.length)];

    // Pick a random word for this seer (assume API provides it)
    const wordList = this.seerWords[q.name];
    if (!wordList || wordList.length === 0) return; // Skip if no word found

    const selectedWord = wordList[Math.floor(Math.random() * wordList.length)];

    this.currentItem.set({
      id: Date.now(),
      seer: q,
      word: selectedWord.word,
      hint: selectedWord.hint,
      yPosition: 0,
      isCaught: false,
      basketType: null
    });
  }

  startGameLoop(): void {
    this.gameLoopInterval = setInterval(() => {
      const item = this.currentItem();
      if (!item || item.isCaught || this.isGameOver()) return;

      const newY = item.yPosition + this.fallSpeed;
      if (newY >= 100) {
        // Hit the ground
        this.handleMissedItem();
      } else {
        this.currentItem.set({ ...item, yPosition: newY });
      }
    }, this.tickRate);
  }

  stopGameLoop(): void {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  handleMissedItem(): void {
    this.audioService.playError();
    this.lives.update(l => l - 1);
    this.total.update(t => t + 1);

    this.isWrong.set(true);
    setTimeout(() => this.isWrong.set(false), 500);

    if (this.lives() <= 0) {
      this.endGame(false);
    } else {
      this.spawnNextItem();
    }
  }

  catchItem(basketId: string): void {
    const item = this.currentItem();
    if (!item || item.isCaught || this.isGameOver()) return;

    // Mark as caught and animate to basket
    this.currentItem.set({ ...item, isCaught: true, basketType: basketId });

    const expected = this.getExpectedBasket(item.seer);
    this.total.update(t => t + 1);

    if (basketId === expected) {
      // Correct!
      this.score.update(s => s + 1);
      this.audioService.playSuccess();
      this.showPlusOne.set(basketId);
      setTimeout(() => this.showPlusOne.set(null), 800);

      // Speed up slightly to make it challenging
      this.fallSpeed = Math.min(this.fallSpeed + 0.15, 1.5);

      if (this.score() >= 10) {
        // Win condition (e.g. 10 correct sorts)
        setTimeout(() => this.endGame(true), 800);
      } else {
        setTimeout(() => this.spawnNextItem(), 600);
      }
    } else {
      // Wrong basket
      this.audioService.playError();
      this.lives.update(l => l - 1);

      this.isWrong.set(true);
      setTimeout(() => this.isWrong.set(false), 500);

      if (this.lives() <= 0) {
        setTimeout(() => this.endGame(false), 800);
      } else {
        setTimeout(() => this.spawnNextItem(), 800);
      }
    }
  }

  endGame(won: boolean): void {
    this.stopGameLoop();
    this.isGameOver.set(true);
    this.gameWon.set(won);
    this.currentItem.set(null);

    this.answered.emit({
      isCorrect: won,
      score: this.score(),
      total: this.total()
    });
  }

  restart(): void {
    this.initGame();
  }
}
