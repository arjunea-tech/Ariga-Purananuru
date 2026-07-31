import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';

export interface ThalaiItem {
  id: number;
  nintraSeer: string;        // E.g., 'அகர'
  nintraAsai: string;        // E.g., 'அ-கர'
  nintraType: string;        // E.g., 'கருவிளம்'
  nintraEnding: 'மா' | 'விளம்' | 'காய்' | 'கனி';
  varumSeer: string;         // E.g., 'முதல'
  varumAsai: string;         // E.g., 'மு-தல'
  varumMuthalasai: 'நேர்' | 'நிரை';
  rule: string;              // E.g., 'விளம்முன் நிரை'
  thalaiName: string;        // E.g., 'நிரையொன்றாசிரியத் தளை'
  category: 'ஒன்றிய தளை' | 'ஒன்றாத தளை';
  explanation: string;
}

export interface ThalaiOption {
  thalaiName: string;
  rule: string;
}

@Component({
  selector: 'app-yappu-thalai',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './yappu-thalai.html',
  styleUrls: ['./yappu-thalai.css']
})
export class YappuThalaiComponent implements OnInit, OnChanges {
  private audioService = inject(AudioService);

  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  // Game state signals
  currentIndex = signal<number>(0);
  score = signal<number>(0);
  total = signal<number>(0);
  streak = signal<number>(0);
  maxQuestions = signal<number>(5);

  currentQuestion = signal<ThalaiItem | null>(null);
  selectedOption = signal<string | null>(null);
  options = signal<ThalaiOption[]>([]);

  isAnswered = signal<boolean>(false);
  isCorrect = signal<boolean | null>(null);
  showExplanation = signal<boolean>(false);
  gameCompleted = signal<boolean>(false);

  // Full dataset of 7 Thalai types
  defaultThalaiDataset: ThalaiItem[] = [
    {
      id: 1,
      nintraSeer: 'கற்பக்',
      nintraAsai: 'கற்-பக்',
      nintraType: 'தேமா',
      nintraEnding: 'மா',
      varumSeer: 'கற்றபின்',
      varumAsai: 'கற்-ற-பின்',
      varumMuthalasai: 'நேர்',
      rule: 'மாமுன் நேர்',
      thalaiName: 'நேரொன்றாசிரியத் தளை',
      category: 'ஒன்றிய தளை',
      explanation: 'நின்ற சீரின் இறுதியில் "மா" (தேமா) வந்து, வரும் சீரின் முதலில் "நேர்" அசை வந்ததால் இது நேரொன்றாசிரியத் தளை ஆகும்.'
    },
    {
      id: 2,
      nintraSeer: 'அகர',
      nintraAsai: 'அ-கர',
      nintraType: 'கருவிளம்',
      nintraEnding: 'விளம்',
      varumSeer: 'முதல',
      varumAsai: 'மு-தல',
      varumMuthalasai: 'நிரை',
      rule: 'விளம்முன் நிரை',
      thalaiName: 'நிரையொன்றாசிரியத் தளை',
      category: 'ஒன்றிய தளை',
      explanation: 'நின்ற சீரின் இறுதியில் "விளம்" (கருவிளம்) வந்து, வரும் சீரின் முதலில் "நிரை" அசை வந்ததால் இது நிரையொன்றாசிரியத் தளை ஆகும்.'
    },
    {
      id: 3,
      nintraSeer: 'எழுத்தெல்லாம்',
      nintraAsai: 'எழுத்-தெல்-லாம்',
      nintraType: 'புளிமாங்காய்',
      nintraEnding: 'காய்',
      varumSeer: 'ஆதி',
      varumAsai: 'ஆ-தி',
      varumMuthalasai: 'நேர்',
      rule: 'காய்முன் நேர்',
      thalaiName: 'வெண்சீர் வெண்டளை',
      category: 'ஒன்றிய தளை',
      explanation: 'நின்ற சீரின் இறுதியில் "காய்" (புளிமாங்காய்) வந்து, வரும் சீரின் முதலில் "நேர்" அசை வந்ததால் இது வெண்சீர் வெண்டளை (காய்சீர் வெண்டளை) ஆகும்.'
    },
    {
      id: 4,
      nintraSeer: 'செல்வக்',
      nintraAsai: 'செல்-வக்',
      nintraType: 'தேமா',
      nintraEnding: 'மா',
      varumSeer: 'அறவாழி',
      varumAsai: 'அ-ற-வா-ழி',
      varumMuthalasai: 'நிரை',
      rule: 'மாமுன் நிரை',
      thalaiName: 'இயற்சீர் வெண்டளை',
      category: 'ஒன்றாத தளை',
      explanation: 'நின்ற சீரின் இறுதியில் "மா" வந்து, வரும் சீரின் முதலில் "நிரை" அசை வந்ததால் இது இயற்சீர் வெண்டளை ஆகும்.'
    },
    {
      id: 5,
      nintraSeer: 'அகர',
      nintraAsai: 'அ-கர',
      nintraType: 'கருவிளம்',
      nintraEnding: 'விளம்',
      varumSeer: 'கற்றான்',
      varumAsai: 'கற்-றான்',
      varumMuthalasai: 'நேர்',
      rule: 'விளம்முன் நேர்',
      thalaiName: 'இயற்சீர் வெண்டளை',
      category: 'ஒன்றாத தளை',
      explanation: 'நின்ற சீரின் இறுதியில் "விளம்" வந்து, வரும் சீரின் முதலில் "நேர்" அசை வந்ததால் இது இயற்சீர் வெண்டளை ஆகும்.'
    },
    {
      id: 6,
      nintraSeer: 'வானெல்லாம்',
      nintraAsai: 'வா-னெல்-லாம்',
      nintraType: 'தேமாங்காய்',
      nintraEnding: 'காய்',
      varumSeer: 'அறநெறி',
      varumAsai: 'அ-ற-நெ-றி',
      varumMuthalasai: 'நிரை',
      rule: 'காய்முன் நிரை',
      thalaiName: 'கலித்தளை',
      category: 'ஒன்றாத தளை',
      explanation: 'நின்ற சீரின் இறுதியில் "காய்" வந்து, வரும் சீரின் முதலில் "நிரை" அசை வந்ததால் இது கலித்தளை ஆகும்.'
    },
    {
      id: 7,
      nintraSeer: 'செயற்கரிய',
      nintraAsai: 'செ-யற்-க-ரிய',
      nintraType: 'கூவிளங்கனி',
      nintraEnding: 'கனி',
      varumSeer: 'அறவோன்',
      varumAsai: 'அ-ற-வோன்',
      varumMuthalasai: 'நிரை',
      rule: 'கனிமுன் நிரை',
      thalaiName: 'ஒன்றிய வஞ்சித்தளை',
      category: 'ஒன்றிய தளை',
      explanation: 'நின்ற சீரின் இறுதியில் "கனி" வந்து, வரும் சீரின் முதலில் "நிரை" அசை வந்ததால் இது ஒன்றிய வஞ்சித்தளை ஆகும்.'
    },
    {
      id: 8,
      nintraSeer: 'செயற்கரிய',
      nintraAsai: 'செ-யற்-க-ரிய',
      nintraType: 'கூவிளங்கனி',
      nintraEnding: 'கனி',
      varumSeer: 'கற்றான்',
      varumAsai: 'கற்-றான்',
      varumMuthalasai: 'நேர்',
      rule: 'கனிமுன் நேர்',
      thalaiName: 'ஒன்றாத வஞ்சித்தளை',
      category: 'ஒன்றாத தளை',
      explanation: 'நின்ற சீரின் இறுதியில் "கனி" வந்து, வரும் சீரின் முதலில் "நேர்" அசை வந்ததால் இது ஒன்றாத வஞ்சித்தளை ஆகும்.'
    }
  ];

  allThalaiMap: { [key: string]: string } = {
    'நேரொன்றாசிரியத் தளை': 'மாமுன் நேர்',
    'நிரையொன்றாசிரியத் தளை': 'விளம்முன் நிரை',
    'இயற்சீர் வெண்டளை': 'மாமுன் நிரை / விளம்முன் நேர்',
    'வெண்சீர் வெண்டளை': 'காய்முன் நேர்',
    'கலித்தளை': 'காய்முன் நிரை',
    'ஒன்றிய வஞ்சித்தளை': 'கனிமுன் நிரை',
    'ஒன்றாத வஞ்சித்தளை': 'கனிமுன் நேர்'
  };

  shuffledQuestions = signal<ThalaiItem[]>([]);
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

    const rawQuestions = this.activity?.questions || this.defaultThalaiDataset;
    // Shuffle questions randomly and take up to 5
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

    // Prepare 4 choices: correct answer + 3 distractors
    const allNames = Object.keys(this.allThalaiMap);
    const correctOption: ThalaiOption = {
      thalaiName: q.thalaiName,
      rule: q.rule
    };

    const distractors = allNames
      .filter(name => name !== q.thalaiName)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(name => ({
        thalaiName: name,
        rule: this.allThalaiMap[name]
      }));

    this.options.set(this.shuffleOptions([correctOption, ...distractors]));
  }

  selectOption(opt: ThalaiOption): void {
    if (this.isAnswered()) return;

    const q = this.currentQuestion();
    if (!q) return;

    this.selectedOption.set(opt.thalaiName);
    this.isAnswered.set(true);

    const isRight = opt.thalaiName === q.thalaiName;
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

    // Advance to next question automatically after 1200ms flash to allow snap animation
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

  private shuffleOptions<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }
}
