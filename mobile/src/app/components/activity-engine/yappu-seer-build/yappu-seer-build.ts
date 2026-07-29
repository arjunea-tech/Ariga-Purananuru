import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';
import { Seer, SEERS_2, SEERS_3, ALL_SEERS, getSeersData } from '../yappu-seer-data';

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
    const rawLevel = this.activity?.level;
    const parsedLevel = (rawLevel !== undefined && rawLevel !== null && rawLevel !== '') ? Number(rawLevel) : 2;
    this.level.set(isNaN(parsedLevel) ? 2 : parsedLevel);
    this.score.set(0);
    this.total.set(0);
    this.nextQuestion();
  }

  getPool(): Seer[] {
    const l = this.level();
    const data = getSeersData(this.activity);
    return l === 2 ? data.seers_2 : l === 3 ? data.seers_3 : data.all_seers;
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
        if (!correct) {
          this.builtPattern.set([]);
          this.buildResult.set(null);
        }
      }, 1600);
    }
  }

  removeLastAsai(): void {
    if (this.buildResult() || this.builtPattern().length === 0) return;
    this.builtPattern.update(p => p.slice(0, -1));
  }
}
