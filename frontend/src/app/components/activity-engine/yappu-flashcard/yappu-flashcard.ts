import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, OnDestroy } from '@angular/core';

import { TamilNLPService } from '../../../services/tamil-nlp.service';

@Component({
  selector: 'app-yappu-flashcard',
  standalone: true,
  imports: [],
  templateUrl: './yappu-flashcard.html',
  styleUrls: ['./yappu-flashcard.css']
})
export class YappuFlashcardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean, score: number, total: number }>();

  gameStarted = signal<boolean>(false);
  gameEnded = signal<boolean>(false);
  timeLeft = signal<number>(30);
  currentWord = signal<string>('');
  correctCount = signal<number>(0);
  totalAnswered = signal<number>(0);
  selectedOption = signal<string | null>(null);
  isAnswerProcessing = signal<boolean>(false);
  
  // Game config
  words: string[] = [];
  wordsQueue: string[] = [];
  options: string[] = [];
  correctFormula = '';
  
  private timerId: any = null;

  constructor(private tamilNLPService: TamilNLPService) {}

  ngOnInit(): void {
    this.setupGame();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.setupGame();
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  setupGame(): void {
    this.clearTimer();
    this.gameStarted.set(false);
    this.gameEnded.set(false);
    this.timeLeft.set(30);
    this.correctCount.set(0);
    this.totalAnswered.set(0);
    this.selectedOption.set(null);
    this.isAnswerProcessing.set(false);

    if (!this.activity) return;

    const rawText = this.activity.text || '';
    const rawWords = rawText.split(',').map((w: string) => w.trim()).filter(Boolean);
    const syllableCount = Number(this.activity.syllableCount) || 1;

    // Filter words matching the configured syllable count to ensure high quality gameplay
    this.words = rawWords.filter((w: string) => {
      const asais = this.tamilNLPService.identifyAsai(w);
      return asais.length === syllableCount;
    });

    // Fallback in case no words fit the criteria
    if (this.words.length === 0) {
      this.words = rawWords;
    }

    // Generate option list based on syllableCount
    if (syllableCount === 1) {
      this.options = ['நேர்', 'நிரை'];
    } else if (syllableCount === 2) {
      this.options = [
        'நேர் + நேர்',
        'நேர் + நிரை',
        'நிரை + நேர்',
        'நிரை + நிரை'
      ];
    } else {
      this.options = [
        'நேர் + நேர் + நேர்',
        'நேர் + நேர் + நிரை',
        'நேர் + நிரை + நேர்',
        'நேர் + நிரை + நிரை',
        'நிரை + நேர் + நேர்',
        'நிரை + நேர் + நிரை',
        'நிரை + நிரை + நேர்',
        'நிரை + நிரை + நிரை'
      ];
    }

    this.reshuffleQueue();
  }

  startGame(): void {
    this.gameStarted.set(true);
    this.gameEnded.set(false);
    this.timeLeft.set(30);
    this.correctCount.set(0);
    this.totalAnswered.set(0);
    this.selectedOption.set(null);
    this.isAnswerProcessing.set(false);
    
    this.nextWord();
    this.startTimer();
  }

  startTimer(): void {
    this.clearTimer();
    this.timerId = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 1) {
          this.endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  reshuffleQueue(): void {
    this.wordsQueue = [...this.words];
    // Fisher-Yates shuffle
    for (let i = this.wordsQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.wordsQueue[i], this.wordsQueue[j]] = [this.wordsQueue[j], this.wordsQueue[i]];
    }
  }

  nextWord(): void {
    if (this.wordsQueue.length === 0) {
      this.reshuffleQueue();
    }

    const word = this.wordsQueue.pop() || '';
    this.currentWord.set(word);
    this.selectedOption.set(null);
    this.isAnswerProcessing.set(false);

    // Compute the correct answer formula
    const asais = this.tamilNLPService.identifyAsai(word);
    this.correctFormula = asais.map(a => a.type).join(' + ');
  }

  selectOption(opt: string): void {
    if (this.isAnswerProcessing() || this.gameEnded() || !this.gameStarted()) return;

    this.selectedOption.set(opt);
    this.isAnswerProcessing.set(true);
    this.totalAnswered.update(c => c + 1);

    const isCorrect = (opt === this.correctFormula);
    if (isCorrect) {
      this.correctCount.update(c => c + 1);
    }

    // Brief timeout so student can see correct/incorrect feedback
    setTimeout(() => {
      if (this.gameStarted() && !this.gameEnded()) {
        this.nextWord();
      }
    }, 800);
  }

  endGame(): void {
    this.clearTimer();
    this.gameEnded.set(true);
    this.answered.emit({
      isCorrect: this.correctCount() > 0,
      score: this.correctCount(),
      total: this.totalAnswered()
    });
  }

  resetGame(): void {
    this.setupGame();
  }
}
