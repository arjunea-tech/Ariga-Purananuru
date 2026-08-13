import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, inject } from '@angular/core';

import { AudioService } from '../../../services/audio.service';

export interface EetruSeerItem {
  id: number;
  seer: string;          // E.g. 'உலகு'
  asaiBreakdown: string; // E.g. 'உ-லகு'
  asaiType: 'நேர்' | 'நிரை' | 'நேர்பு' | 'நிரைபு';
  vaibaadu: 'நாள்' | 'மலர்' | 'காசு' | 'பிறப்பு';
  kuralNo?: number;
  lineSnippet?: string;  // E.g. 'பகவன் முதற்றே உலகு'
  explanation: string;
}

export interface EetruOption {
  vaibaadu: 'நாள்' | 'மலர்' | 'காசு' | 'பிறப்பு';
  asaiType: string;
  icon: string;
}

@Component({
  selector: 'app-yappu-eetru-seer',
  standalone: true,
  imports: [],
  templateUrl: './yappu-eetru-seer.html',
  styleUrls: ['./yappu-eetru-seer.css']
})
export class YappuEetruSeerComponent implements OnInit, OnChanges {
  private audioService = inject(AudioService);

  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  // Signals
  currentIndex = signal<number>(0);
  score = signal<number>(0);
  total = signal<number>(0);
  streak = signal<number>(0);
  maxQuestions = signal<number>(5);

  currentQuestion = signal<EetruSeerItem | null>(null);
  selectedOption = signal<string | null>(null);

  isAnswered = signal<boolean>(false);
  isCorrect = signal<boolean | null>(null);
  showExplanation = signal<boolean>(false);
  gameCompleted = signal<boolean>(false);

  allFormulaOptions: EetruOption[] = [
    { vaibaadu: 'நாள்', asaiType: 'நேர்', icon: '☀️' },
    { vaibaadu: 'மலர்', asaiType: 'நிரை', icon: '🌸' },
    { vaibaadu: 'காசு', asaiType: 'நேர்பு', icon: '🪙' },
    { vaibaadu: 'பிறப்பு', asaiType: 'நிரைபு', icon: '🌱' }
  ];

  shuffledQuestions = signal<EetruSeerItem[]>([]);
  private autoAdvanceTimer: any = null;

  ngOnInit(): void {
    this.initGame();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.initGame();
    }
  }

  initGame(): void {
    this.clearAutoAdvanceTimer();
    this.score.set(0);
    this.total.set(0);
    this.streak.set(0);
    this.currentIndex.set(0);
    this.gameCompleted.set(false);

    const rawQuestions = this.activity?.questions || [];
    // Shuffle questions randomly
    const shuffled = [...rawQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, this.maxQuestions());
    this.shuffledQuestions.set(shuffled);

    this.loadQuestion();
  }

  loadQuestion(): void {
    this.clearAutoAdvanceTimer();
    const questions = this.shuffledQuestions();
    if (this.currentIndex() >= questions.length) {
      this.gameCompleted.set(true);
      this.answered.emit({
        isCorrect: true, // Activity completed
        score: this.score(),
        total: this.total()
      });
      return;
    }

    const q = questions[this.currentIndex()];
    this.currentQuestion.set(q);
    this.selectedOption.set(null);
    this.isAnswered.set(false);
    this.isCorrect.set(null);
    this.showExplanation.set(false);
  }

  selectOption(opt: EetruOption): void {
    if (this.isAnswered()) return;

    const q = this.currentQuestion();
    if (!q) return;

    this.selectedOption.set(opt.vaibaadu);
    this.isAnswered.set(true);

    const isRight = opt.vaibaadu === q.vaibaadu;
    this.isCorrect.set(isRight);
    this.total.update(t => t + 1);

    if (isRight) {
      this.audioService.playSuccess();
      this.score.update(s => s + 1);
      this.streak.update(st => st + 1);
    } else {
      this.audioService.playError();
      this.streak.set(0);
    }

    // Advance to next question automatically after 1200ms flash
    this.autoAdvanceTimer = setTimeout(() => {
      this.nextQuestion();
    }, 1200);
  }

  nextQuestion(): void {
    this.clearAutoAdvanceTimer();
    this.currentIndex.update(i => i + 1);
    this.loadQuestion();
  }

  restartGame(): void {
    this.initGame();
  }

  private clearAutoAdvanceTimer(): void {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }
}
