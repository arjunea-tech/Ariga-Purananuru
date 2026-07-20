import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';
import { Seer, SEERS_2, SEERS_3, ALL_SEERS } from '../yappu-seer/yappu-seer';

@Component({
  selector: 'app-yappu-seer-build',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './yappu-seer-build.html',
  styleUrls: ['./yappu-seer-build.css']
})
export class YappuSeerBuildComponent implements OnInit, OnChanges, OnDestroy {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  private audioService = inject(AudioService);

  level = signal<number>(2);
  question = signal<Seer | null>(null);
  score = signal<number>(0);
  total = signal<number>(0);

  builtPattern = signal<string[]>([]);
  buildResult = signal<'correct' | 'wrong' | null>(null);

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
    this.nextQuestion();
  }

  getPool(): Seer[] {
    const l = this.level();
    return l === 2 ? SEERS_2 : l === 3 ? SEERS_3 : ALL_SEERS;
  }

  nextQuestion(): void {
    const pool = this.getPool();
    if (pool.length === 0) return;

    const q = pool[Math.floor(Math.random() * pool.length)];
    this.question.set(q);
    this.builtPattern.set([]);
    this.buildResult.set(null);
  }

  addAsai(asai: string): void {
    const currentQ = this.question();
    if (!currentQ || this.buildResult()) return;

    const next = [...this.builtPattern(), asai];
    this.builtPattern.set(next);

    const target = currentQ.pattern;
    if (next.length === target.length) {
      const correct = next.every((a, i) => a === target[i]);
      this.buildResult.set(correct ? 'correct' : 'wrong');
      this.total.update(t => t + 1);

      if (correct) {
        this.score.update(s => s + 1);
        this.audioService.playSuccess();
      } else {
        this.audioService.playError();
      }

      this.answered.emit({
        isCorrect: correct,
        score: this.score(),
        total: this.total()
      });

      setTimeout(() => {
        this.nextQuestion();
      }, 1600);
    }
  }

  removeLastAsai(): void {
    if (this.buildResult() || this.builtPattern().length === 0) return;
    this.builtPattern.update(p => p.slice(0, -1));
  }
}
