import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, signal, inject } from '@angular/core';

import { AudioService } from '../../../services/audio.service';
import { Seer, SEERS_2, SEERS_3, ALL_SEERS } from '../yappu-seer/yappu-seer';

@Component({
  selector: 'app-yappu-seer-n2p',
  standalone: true,
  imports: [],
  templateUrl: './yappu-seer-n2p.html',
  styleUrls: ['./yappu-seer-n2p.css']
})
export class YappuSeerN2pComponent implements OnInit, OnChanges, OnDestroy {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  private audioService = inject(AudioService);

  level = signal<number>(2);
  question = signal<Seer | null>(null);
  options = signal<Seer[]>([]);
  selectedAnswer = signal<string | null>(null);
  score = signal<number>(0);
  total = signal<number>(0);
  streak = signal<number>(0);

  ngOnInit(): void {
    this.initGame();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.initGame();
    }
  }

  ngOnDestroy(): void {}

  initGame(): void {
    this.level.set(this.activity?.level !== undefined ? parseInt(this.activity.level) : 2);
    this.score.set(0);
    this.total.set(0);
    this.streak.set(0);
    this.nextQuestion();
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
    this.selectedAnswer.set(null);
  }

  handleAnswer(opt: Seer): void {
    if (this.selectedAnswer()) return;
    const currentQ = this.question();
    if (!currentQ) return;

    this.selectedAnswer.set(opt.name);
    this.total.update(t => t + 1);

    const isCorrect = opt.name === currentQ.name;
    if (isCorrect) {
      this.score.update(s => s + 1);
      this.streak.update(s => s + 1);
      this.audioService.playSuccess();
    } else {
      this.streak.set(0);
      this.audioService.playError();
    }

    this.answered.emit({
      isCorrect: isCorrect,
      score: this.score(),
      total: this.total()
    });

    setTimeout(() => {
      this.nextQuestion();
    }, 1400);
  }
}
