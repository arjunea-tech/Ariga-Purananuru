import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';

export interface EluthuDetectiveChallenge {
  word: string;
  options: Array<{
    splits: string[];
    isCorrect: boolean;
    label: string;
  }>;
  selectedOptionIndex: number | null;
  isAnswered: boolean;
  isCorrect: boolean;
  explanation: string;
}

@Component({
  selector: 'app-eluthu-detective',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eluthu-detective.html',
  styleUrls: ['./eluthu-detective.css']
})
export class EluthuDetectiveComponent implements OnInit, OnChanges {
  private audioService = inject(AudioService);

  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  challenges    = signal<EluthuDetectiveChallenge[]>([]);
  currentIndex  = signal<number>(0);
  currentChallenge = signal<EluthuDetectiveChallenge | null>(null);
  score         = signal<number>(0);
  total         = signal<number>(0);
  streak        = signal<number>(0);

  // Default மயங்கொலி challenges if no activity data
  private defaultChallenges = [
    {
      word: 'தமிழ்',
      correctSplits: ['த', 'மி', 'ழ்'],
      wrongOptions: [['த', 'மி', 'ள்'], ['த', 'மி', 'ல்'], ['த', 'மி', 'ழ']],
      explanation: '\"தமிழ்\" என்ற சொல்லில் இடையின எழுத்து \"ழ்\" வரும். இடையின ழகர மெய்யை தவறாக \"ள்\" அல்லது \"ல்\" எழுதக்கூடாது.'
    },
    {
      word: 'கல்வி',
      correctSplits: ['க', 'ல்', 'வி'],
      wrongOptions: [['க', 'ள்', 'வி'], ['க', 'ழ்', 'வி'], ['க', 'ல்', 'வ']],
      explanation: '\"கல்வி\" என்ற சொல்லில் \"ல்\" என்ற இடையின மெய் வரும். தவறாக \"ள்\" அல்லது \"ழ்\" எழுதக்கூடாது.'
    },
    {
      word: 'மரம்',
      correctSplits: ['ம', 'ர', 'ம்'],
      wrongOptions: [['ம', 'ற', 'ம்'], ['ம', 'ர', 'ன்'], ['ம', 'ற', 'ன்']],
      explanation: '\"மரம்\" என்ற சொல்லில் \"ர\" என்ற இடையின மெய் வரும். தவறாக \"ற்\" (வல்லினம்) எழுதக்கூடாது.'
    },
    {
      word: 'மழை',
      correctSplits: ['ம', 'ழை'],
      wrongOptions: [['ம', 'லை'], ['ம', 'ளை'], ['மா', 'ழை']],
      explanation: '\"மழை\" என்ற சொல்லில் \"ழ்\" என்ற இடையின மெய் வரும். தவறாக \"ல்\" அல்லது \"ள்\" எழுதக்கூடாது.'
    }
  ];

  ngOnInit(): void { this.initGame(); }
  ngOnChanges(changes: SimpleChanges): void { if (changes['activity']) this.initGame(); }

  initGame(): void {
    let rawSource: any[] = [];

    if (this.activity?.word && this.activity?.correctSplits) {
      // Single word mode from seeder
      rawSource = [this.activity];
    } else if (this.activity?.challenges?.length > 0) {
      rawSource = [...this.activity.challenges];
    } else {
      rawSource = [...this.defaultChallenges];
    }

    // Shuffle and take max 10
    rawSource = rawSource.sort(() => Math.random() - 0.5).slice(0, 10);

    const list: EluthuDetectiveChallenge[] = rawSource.map((c: any) => {
      const options: any[] = [];

      const correctSplits = c.correctSplits || [];
      options.push({
        splits: correctSplits,
        isCorrect: true,
        label: correctSplits.join('') // Show as full word
      });

      const wrongOpts: string[][] = c.wrongOptions?.length > 0 ? c.wrongOptions : [];
      wrongOpts.forEach((w: string[]) => {
        options.push({
          splits: w,
          isCorrect: false,
          label: w.join('') // Show as full word
        });
      });

      // Pad to 4 options if needed
      while (options.length < 4) {
        const word = c.word || '';
        // Generate a random dummy wrong word by replacing a random letter with something else
        const randomChars = ['ள', 'ழ', 'ல', 'ற', 'ர', 'ண', 'ன', 'ந'];
        const randomChar = randomChars[Math.floor(Math.random() * randomChars.length)];
        const fallbackWord = word.substring(0, word.length - 1) + randomChar;
        
        if (!options.some(o => o.label === fallbackWord)) {
          options.push({ splits: [fallbackWord], isCorrect: false, label: fallbackWord });
        } else {
          break;
        }
      }

      const shuffled = [...options].sort(() => Math.random() - 0.5);

      return {
        word: c.word || '',
        options: shuffled,
        selectedOptionIndex: null,
        isAnswered: false,
        isCorrect: false,
        explanation: c.explanation || ''
      };
    });

    this.challenges.set(list);
    this.currentIndex.set(0);
    this.currentChallenge.set(list[0] || null);
    this.score.set(0);
    this.total.set(0);
    this.streak.set(0);
  }

  selectOption(optIdx: number): void {
    const curr = this.currentChallenge();
    if (!curr || curr.isAnswered) return;

    const selected = curr.options[optIdx];
    const isCorrect = selected.isCorrect;

    const updated: EluthuDetectiveChallenge = {
      ...curr,
      selectedOptionIndex: optIdx,
      isAnswered: true,
      isCorrect
    };

    this.currentChallenge.set(updated);
    this.total.update(t => t + 1);

    if (isCorrect) {
      this.score.update(s => s + 10);
      this.streak.update(st => st + 1);
      this.audioService.playSuccess();
    } else {
      this.streak.set(0);
      this.audioService.playError();
    }

    this.answered.emit({ isCorrect, score: this.score(), total: this.total() });
  }

  nextChallenge(): void {
    const nextIdx = this.currentIndex() + 1;
    const list = this.challenges();
    if (nextIdx < list.length) {
      this.currentIndex.set(nextIdx);
      this.currentChallenge.set(list[nextIdx]);
    } else {
      this.initGame(); // Reshuffle
    }
  }

  get optionLabels(): string[] { return ['A', 'B', 'C', 'D']; }
}
