import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Tamil letter category maps
const VOWELS     = new Set(['அ','ஆ','இ','ஈ','உ','ஊ','எ','ஏ','ஐ','ஒ','ஓ','ஔ']);
const VALLINA    = new Set(['க்','ச்','ட்','த்','ப்','ற்']);
const MELLINA    = new Set(['ங்','ஞ்','ண்','ந்','ம்','ன்']);
const IDAIYINA   = new Set(['ய்','ர்','ல்','வ்','ழ்','ள்']);
const AAYTHAM    = new Set(['ஃ']);

// Options displayed to the student
const ELUTHU_OPTIONS = ['உயிர் எழுத்து', 'வல்லின மெய்', 'மெல்லின மெய்', 'இடையின மெய்'];

function getLetterCategory(letter: string): string {
  const l = letter.trim();
  if (VOWELS.has(l))   return 'உயிர் எழுத்து';
  if (VALLINA.has(l))  return 'வல்லின மெய்';
  if (MELLINA.has(l))  return 'மெல்லின மெய்';
  if (IDAIYINA.has(l)) return 'இடையின மெய்';
  if (AAYTHAM.has(l))  return 'உயிர் எழுத்து'; // ஆய்தம் - treat with uir group
  return 'உயிர் எழுத்து';
}

@Component({
  selector: 'app-eluthu-flashcard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eluthu-flashcard.html',
  styleUrls: ['./eluthu-flashcard.css']
})
export class EluthuFlashcardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  gameStarted  = signal<boolean>(false);
  gameEnded    = signal<boolean>(false);
  timeLeft     = signal<number>(30);
  currentLetter = signal<string>('');
  correctCategory = '';

  score        = signal<number>(0);
  totalAnswered = signal<number>(0);
  streak       = signal<number>(0);
  selectedOption = signal<string | null>(null);
  isProcessing = signal<boolean>(false);
  lastCorrect  = signal<boolean | null>(null);

  letters: string[] = [];
  letterQueue: string[] = [];
  options = ELUTHU_OPTIONS;

  private timerId: any = null;

  ngOnInit(): void { this.setupGame(); }
  ngOnChanges(changes: SimpleChanges): void { if (changes['activity']) this.setupGame(); }
  ngOnDestroy(): void { this.clearTimer(); }

  setupGame(): void {
    this.clearTimer();
    this.gameStarted.set(false);
    this.gameEnded.set(false);
    this.timeLeft.set(30);
    this.score.set(0);
    this.totalAnswered.set(0);
    this.streak.set(0);
    this.selectedOption.set(null);
    this.isProcessing.set(false);
    this.lastCorrect.set(null);

    const rawText = this.activity?.text || '';
    this.letters = rawText.split(',').map((l: string) => l.trim()).filter(Boolean);
    if (this.letters.length === 0) {
      // Default fallback: all 30 Tamil letters
      this.letters = [
        'அ','ஆ','இ','ஈ','உ','ஊ','எ','ஏ','ஐ','ஒ','ஓ','ஔ',
        'க்','ங்','ச்','ஞ்','ட்','ண்','த்','ந்','ப்','ம்',
        'ய்','ர்','ல்','வ்','ழ்','ள்','ற்','ன்'
      ];
    }
    this.reshuffle();
  }

  startGame(): void {
    this.gameStarted.set(true);
    this.gameEnded.set(false);
    this.timeLeft.set(30);
    this.score.set(0);
    this.totalAnswered.set(0);
    this.streak.set(0);
    this.selectedOption.set(null);
    this.isProcessing.set(false);
    this.lastCorrect.set(null);
    this.nextLetter();
    this.startTimer();
  }

  reshuffle(): void {
    this.letterQueue = [...this.letters];
    for (let i = this.letterQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.letterQueue[i], this.letterQueue[j]] = [this.letterQueue[j], this.letterQueue[i]];
    }
  }

  nextLetter(): void {
    if (this.letterQueue.length === 0) this.reshuffle();
    const letter = this.letterQueue.pop() || 'அ';
    this.currentLetter.set(letter);
    this.correctCategory = getLetterCategory(letter);
    this.selectedOption.set(null);
    this.isProcessing.set(false);
    this.lastCorrect.set(null);
  }

  selectOption(opt: string): void {
    if (this.isProcessing() || this.gameEnded() || !this.gameStarted()) return;

    this.selectedOption.set(opt);
    this.isProcessing.set(true);
    this.totalAnswered.update(t => t + 1);

    const isCorrect = (opt === this.correctCategory);
    this.lastCorrect.set(isCorrect);

    if (isCorrect) {
      this.score.update(s => s + 10);
      this.streak.update(st => st + 1);
    } else {
      this.streak.set(0);
    }

    this.answered.emit({ isCorrect, score: this.score(), total: this.totalAnswered() });

    setTimeout(() => {
      if (this.gameStarted() && !this.gameEnded()) this.nextLetter();
    }, 700);
  }

  startTimer(): void {
    this.clearTimer();
    this.timerId = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 1) { this.endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  clearTimer(): void {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  }

  endGame(): void {
    this.clearTimer();
    this.gameEnded.set(true);
    this.answered.emit({
      isCorrect: this.score() > 0,
      score: this.score(),
      total: this.totalAnswered()
    });
  }

  resetGame(): void { this.setupGame(); }

  get timerPercent(): number { return (this.timeLeft() / 30) * 100; }
}
