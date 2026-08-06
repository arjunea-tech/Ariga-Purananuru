import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, signal, inject } from '@angular/core';

import { AudioService } from '../../../services/audio.service';
import { Seer, SEERS_2, SEERS_3, ALL_SEERS } from '../yappu-seer/yappu-seer';

@Component({
  selector: 'app-yappu-seer-speed',
  standalone: true,
  imports: [],
  templateUrl: './yappu-seer-speed.html',
  styleUrls: ['./yappu-seer-speed.css']
})
export class YappuSeerSpeedComponent implements OnInit, OnChanges, OnDestroy {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  private audioService = inject(AudioService);

  level = signal<number>(2);
  question = signal<Seer | null>(null);
  options = signal<Seer[]>([]);
  score = signal<number>(0);
  total = signal<number>(0);

  timeLeft = signal<number>(30);
  speedPhase = signal<string>('ready'); // 'ready' | 'playing' | 'done'
  private speedTimerId: any = null;

  ngOnInit(): void {
    this.initGame();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.initGame();
    }
  }

  ngOnDestroy(): void {
    this.clearSpeedTimer();
  }

  initGame(): void {
    this.level.set(this.activity?.level !== undefined ? parseInt(this.activity.level) : 2);
    this.score.set(0);
    this.total.set(0);
    this.speedPhase.set('ready');
    this.clearSpeedTimer();
  }

  getPool(): Seer[] {
    const l = this.level();
    return l === 2 ? SEERS_2 : l === 3 ? SEERS_3 : ALL_SEERS;
  }

  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  generateOptions(correct: Seer, pool: Seer[], count = 4): Seer[] {
    const opts = [correct];
    const others = pool.filter(s => s.name !== correct.name);
    const shuffled = this.shuffle(others);
    for (let i = 0; opts.length < count && i < shuffled.length; i++) {
      opts.push(shuffled[i]);
    }
    return this.shuffle(opts);
  }

  nextQuestion(): void {
    const pool = this.getPool();
    if (pool.length === 0) return;

    const q = pool[Math.floor(Math.random() * pool.length)];
    this.question.set(q);
    this.options.set(this.generateOptions(q, pool, Math.min(4, pool.length)));
  }

  startSpeedRound(): void {
    this.speedPhase.set('playing');
    this.score.set(0);
    this.total.set(0);
    this.timeLeft.set(30);
    this.nextQuestion();

    this.clearSpeedTimer();
    this.speedTimerId = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 1) {
          this.endSpeedRound();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  handleSpeedAnswer(opt: Seer): void {
    const currentQ = this.question();
    if (!currentQ) return;

    this.total.update(t => t + 1);
    if (opt.name === currentQ.name) {
      this.score.update(s => s + 1);
      this.audioService.playSuccess();
    } else {
      this.audioService.playError();
    }
    this.nextQuestion();
  }

  endSpeedRound(): void {
    this.clearSpeedTimer();
    this.speedPhase.set('done');
    this.answered.emit({
      isCorrect: this.score() >= 5,
      score: this.score(),
      total: this.total()
    });
  }

  clearSpeedTimer(): void {
    if (this.speedTimerId) {
      clearInterval(this.speedTimerId);
      this.speedTimerId = null;
    }
  }
}
