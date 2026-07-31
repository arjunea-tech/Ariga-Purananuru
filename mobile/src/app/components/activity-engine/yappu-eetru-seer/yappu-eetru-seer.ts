import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
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

  defaultDataset: EetruSeerItem[] = [
    {
      id: 1,
      seer: 'உலகு',
      asaiBreakdown: 'உ-லகு',
      asaiType: 'நிரை',
      vaibaadu: 'மலர்',
      kuralNo: 1,
      lineSnippet: 'பகவன் முதற்றே உலகு',
      explanation: "'உலகு' என்னும் சீர் 'உ-லகு' எனப் பிரியும். இரு குறில் இணைந்து (நிரை அசை) வருவதால் இதன் வாய்ப்பாடு 'மலர்' ஆகும்."
    },
    {
      id: 2,
      seer: 'தக',
      asaiBreakdown: 'த-க',
      asaiType: 'நிரை',
      vaibaadu: 'மலர்',
      kuralNo: 391,
      lineSnippet: 'நிற்க அதற்குத் தக',
      explanation: "'தக' என்னும் சீர் 'த-க' என இரு குறில் இணைந்து (நிரை அசை) வருவதால் இதன் வாய்ப்பாடு 'மலர்' ஆகும்."
    },
    {
      id: 3,
      seer: 'தார்',
      asaiBreakdown: 'தார்',
      asaiType: 'நேர்',
      vaibaadu: 'நாள்',
      kuralNo: 26,
      lineSnippet: 'செயற்கரிய செய்கலா தார்',
      explanation: "'தார்' என்னும் சீர் நெடில் ஒற்று இணைந்து (நேர் அசை) வருவதால் இதன் வாய்ப்பாடு 'நாள்' ஆகும்."
    },
    {
      id: 4,
      seer: 'தற்று',
      asaiBreakdown: 'தற்-று',
      asaiType: 'நேர்பு',
      vaibaadu: 'காசு',
      kuralNo: 139,
      lineSnippet: 'கனிஇருப்பக் காய்வர்ந்த தற்று',
      explanation: "'தற்று' என்னும் சீர் 'தற்-று' எனப் பிரிந்து, நேர் அசையின் பின் குற்றியலுகரம் (உகரம்) பெற்று வருவதால் 'நேர்பு' அசை ஆகி 'காசு' வாய்ப்பாடு ஆகும்."
    },
    {
      id: 5,
      seer: 'அறிவு',
      asaiBreakdown: 'அ-றிவு',
      asaiType: 'நிரைபு',
      vaibaadu: 'பிறப்பு',
      kuralNo: 423,
      lineSnippet: 'மெய்ப்பொருள் காண்பது அறிவு',
      explanation: "'அறிவு' என்னும் சீர் 'அ-றிவு' எனப் பிரிந்து, நிரை அசையின் பின் குற்றியலுகரம் பெற்று வருவதால் 'நிரைபு' அசை ஆகி 'பிறப்பு' வாய்ப்பாடு ஆகும்."
    },
    {
      id: 6,
      seer: 'அமைச்சு',
      asaiBreakdown: 'அ-மைச்-சு',
      asaiType: 'நிரைபு',
      vaibaadu: 'பிறப்பு',
      kuralNo: 631,
      lineSnippet: 'கருவியும் காலமும் செய்இடனும் அமைச்சு',
      explanation: "'அமைச்சு' என்னும் சீரில் இறுதிச் சீர் நிரை அசையுடன் குற்றியலுகரம் (சு) இணைந்து வருவதால் 'நிரைபு' அசை ஆகி 'பிறப்பு' வாய்ப்பாடு ஆகும்."
    },
    {
      id: 7,
      seer: 'சார்பு',
      asaiBreakdown: 'சார்-பு',
      asaiType: 'நேர்பு',
      vaibaadu: 'காசு',
      kuralNo: 67,
      lineSnippet: 'செயற்கரிய செய்பவர் சார்பு',
      explanation: "'சார்பு' என்னும் சீர் நேர் அசையின் பின் குற்றியலுகரம் பெற்று வருவதால் 'நேர்பு' அசை ஆகி 'காசு' வாய்ப்பாடு ஆகும்."
    },
    {
      id: 8,
      seer: 'சீர்',
      asaiBreakdown: 'சீர்',
      asaiType: 'நேர்',
      vaibaadu: 'நாள்',
      kuralNo: 100,
      lineSnippet: 'நன்றியுடையார் சீர்',
      explanation: "'சீர்' என்னும் சீர் தனி நெடில் ஒற்று இணைந்து (நேர் அசை) வருவதால் இதன் வாய்ப்பாடு 'நாள்' ஆகும்."
    }
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

    const rawQuestions = this.activity?.questions || this.defaultDataset;
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
