import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, signal, inject } from '@angular/core';

import { AudioService } from '../../../services/audio.service';

// ─── Data Layer ───────────────────────────────────────────────
export const ASAI = { NEER: 'நேர்', NIRAI: 'நிரை' };

export interface Seer {
  name: string;
  pattern: string[];
  mnemonic: string;
  fruit: string;
}

export const SEERS_2: Seer[] = [
  { name: 'தேமா', pattern: [ASAI.NEER, ASAI.NEER], mnemonic: 'தே=நேர், மா=நேர்', fruit: '🥭' },
  { name: 'புளிமா', pattern: [ASAI.NIRAI, ASAI.NEER], mnemonic: 'புளி=நிரை, மா=நேர்', fruit: '🍋' },
  { name: 'கூவிளம்', pattern: [ASAI.NEER, ASAI.NIRAI], mnemonic: 'கூ=நேர், விளம்=நிரை', fruit: '🍈' },
  { name: 'கருவிளம்', pattern: [ASAI.NIRAI, ASAI.NIRAI], mnemonic: 'கரு=நிரை, விளம்=நிரை', fruit: '🫐' },
];

export const SEERS_3: Seer[] = [
  { name: 'தேமாங்காய்', pattern: [ASAI.NEER, ASAI.NEER, ASAI.NEER], mnemonic: 'நேர்நேர்நேர்', fruit: '🥭' },
  { name: 'புளிமாங்காய்', pattern: [ASAI.NIRAI, ASAI.NEER, ASAI.NEER], mnemonic: 'நிரைநேர்நேர்', fruit: '🍋' },
  { name: 'கூவிளங்காய்', pattern: [ASAI.NEER, ASAI.NIRAI, ASAI.NEER], mnemonic: 'நேர்நிரைநேர்', fruit: '🍈' },
  { name: 'கருவிளங்காய்', pattern: [ASAI.NIRAI, ASAI.NIRAI, ASAI.NEER], mnemonic: 'நிரைநிரைநேர்', fruit: '🫐' },
  { name: 'தேமாங்கனி', pattern: [ASAI.NEER, ASAI.NEER, ASAI.NIRAI], mnemonic: 'நேர்நேர்நிரை', fruit: '🥭' },
  { name: 'புளிமாங்கனி', pattern: [ASAI.NIRAI, ASAI.NEER, ASAI.NIRAI], mnemonic: 'நிரைநேர்நிரை', fruit: '🍋' },
  { name: 'கூவிளங்கனி', pattern: [ASAI.NEER, ASAI.NIRAI, ASAI.NIRAI], mnemonic: 'நேர்நிரைநிரை', fruit: '🍈' },
  { name: 'கருவிளங்கனி', pattern: [ASAI.NIRAI, ASAI.NIRAI, ASAI.NIRAI], mnemonic: 'நிரைநிரைநிரை', fruit: '🫐' },
];

export const ALL_SEERS = [...SEERS_2, ...SEERS_3];

// ─── Component Declaration ────────────────────────────────────
@Component({
  selector: 'app-yappu-seer',
  standalone: true,
  imports: [],
  templateUrl: './yappu-seer.html',
  styleUrls: ['./yappu-seer.css']
})
export class YappuSeerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  private audioService = inject(AudioService);

  // Router States: 'home' | 'level' | 'play'
  screen = signal<string>('home');
  selectedGameId = signal<string | null>(null);
  level = signal<number>(2); // 2: ஈரசை, 3: மூவசை, 0: அனைத்தும்

  // Game Play States
  question = signal<Seer | null>(null);
  options = signal<Seer[]>([]);
  selectedAnswer = signal<string | null>(null);
  score = signal<number>(0);
  total = signal<number>(0);
  streak = signal<number>(0);

  // Speed Round States
  timeLeft = signal<number>(30);
  speedPhase = signal<string>('ready'); // 'ready' | 'playing' | 'done'
  private speedTimerId: any = null;

  // Build Pattern States
  builtPattern = signal<string[]>([]);
  buildResult = signal<'correct' | 'wrong' | null>(null);

  // Match Pairs States
  matchCards = signal<any[]>([]);
  matchFlipped = signal<number[]>([]);
  matchMatched = signal<Set<number>>(new Set());
  matchIncorrect = signal<number[]>([]);
  matchMoves = signal<number>(0);
  matchWon = signal<boolean>(false);

  // Games Config
  GAMES = [
    { id: 'p2n', icon: '🔷', title: 'வடிவம் → பெயர்', desc: 'அசை வடிவத்தைப் பார்த்து சீரின் பெயரைக் கண்டறியுங்கள்' },
    { id: 'n2p', icon: '🔤', title: 'பெயர் → வடிவம்', desc: 'சீரின் பெயரைப் பார்த்து அசை வடிவத்தைத் தேர்வு செய்யுங்கள்' },
    { id: 'build', icon: '🧱', title: 'சீர் கட்டமைப்பு', desc: 'அசைகளைச் சேர்த்து சீரை உருவாக்குங்கள்' },
    { id: 'speed', icon: '⚡', title: 'வேக வினா', desc: '30 வினாடிகளில் அதிக சீர்களைக் கண்டறியுங்கள்' },
    { id: 'match', icon: '🃏', title: 'ஜோடி பொருத்து', desc: 'பெயர்களையும் வடிவங்களையும் பொருத்துங்கள்' },
  ];

  ngOnInit(): void {
    this.resetToHome();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.resetToHome();
    }
  }

  ngOnDestroy(): void {
    this.clearSpeedTimer();
  }

  // Navigation handlers
  selectGame(gameId: string): void {
    this.selectedGameId.set(gameId);
    this.screen.set('level');
  }

  startGame(l: number): void {
    this.level.set(l);
    this.screen.set('play');
    this.score.set(0);
    this.total.set(0);
    this.streak.set(0);

    const gameId = this.selectedGameId();
    if (gameId === 'speed') {
      this.speedPhase.set('ready');
      this.clearSpeedTimer();
    } else if (gameId === 'match') {
      this.setupMatchPairs();
    } else {
      this.nextQuestion();
    }
  }

  resetToHome(): void {
    if (this.activity?.type && this.activity.type.startsWith('yappu_seer_')) {
      const subType = this.activity.type.replace('yappu_seer_', '');
      this.selectedGameId.set(subType);
      this.level.set(this.activity.level !== undefined ? parseInt(this.activity.level) : 2);
      this.screen.set('play');
      this.score.set(0);
      this.total.set(0);
      this.streak.set(0);
      if (subType === 'speed') {
        this.speedPhase.set('ready');
        this.clearSpeedTimer();
      } else if (subType === 'match') {
        this.setupMatchPairs();
      } else {
        this.nextQuestion();
      }
    } else {
      this.screen.set('home');
      this.selectedGameId.set(null);
      this.clearSpeedTimer();
    }
  }

  // Utilities
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

  // Core gameplay logic
  nextQuestion(): void {
    const pool = this.getPool();
    if (pool.length === 0) return;

    const q = pool[Math.floor(Math.random() * pool.length)];
    this.question.set(q);
    this.options.set(this.generateOptions(q, pool, Math.min(4, pool.length)));
    this.selectedAnswer.set(null);

    // Reset build slots
    this.builtPattern.set([]);
    this.buildResult.set(null);
  }

  handleAnswer(opt: Seer): void {
    if (this.selectedAnswer()) return;
    const currentQ = this.question();
    if (!currentQ) return;

    this.selectedAnswer.set(opt.name);
    this.total.update(t => t + 1);

    if (opt.name === currentQ.name) {
      this.score.update(s => s + 1);
      this.streak.update(s => s + 1);
      this.audioService.playSuccess();
    } else {
      this.streak.set(0);
      this.audioService.playError();
    }

    setTimeout(() => {
      this.nextQuestion();
    }, 1400);
  }

  // Speed Round Methods
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

  // Build Pattern Methods
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

      setTimeout(() => {
        this.nextQuestion();
      }, 1600);
    }
  }

  removeLastAsai(): void {
    if (this.buildResult() || this.builtPattern().length === 0) return;
    this.builtPattern.update(p => p.slice(0, -1));
  }

  setupMatchPairs(): void {
    const pool = this.getPool();
    const nameCards = pool.map((s, i) => ({ id: `n${i}`, type: 'name', name: s.name, fruit: s.fruit, pattern: s.pattern, matchId: i }));
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
