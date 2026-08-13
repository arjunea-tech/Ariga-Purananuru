import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, inject } from '@angular/core';

import { TamilNLPService } from '../../../services/tamil-nlp.service';
import { AudioService } from '../../../services/audio.service';

export interface YappuAsaiDetectiveData {
  type: 'yappu_asai_detective';
  question?: string;
  words?: string[];
  challenges?: Array<{
    word: string;
    incorrectSplits: string[]; // e.g., ['தா', 'மர', 'ை'] or ['அ', 'கர', 'ம்']
    correctSplits: string[];   // e.g., ['தாம', 'ரை'] or ['அக', 'ரம்']
    errorType: string;        // e.g., 'ஒற்று பிழை' or 'குறில்-நெடில் பிரிப்பு பிழை'
    explanation: string;
  }>;
}

export interface DetectiveChallenge {
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
  selector: 'app-yappu-asai-detective',
  standalone: true,
  imports: [],
  templateUrl: './yappu-asai-detective.html',
  styleUrls: ['./yappu-asai-detective.css']
})
export class YappuAsaiDetectiveComponent implements OnInit, OnChanges {
  private tamilNLPService = inject(TamilNLPService);
  private audioService = inject(AudioService);

  @Input() activity: YappuAsaiDetectiveData | null = null;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  // Game States
  challenges = signal<DetectiveChallenge[]>([]);
  currentIndex = signal<number>(0);
  currentChallenge = signal<DetectiveChallenge | null>(null);

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

  generateOptionsForWord(word: string): any[] {
    const correctGroups = this.tamilNLPService.identifyAsai(word);
    const correctSplits = correctGroups.map(g => g.text);
    
    // Label for correct split
    const labelExplanation = correctGroups.map(g => `${g.text} (${g.type})`).join(' + ');
    const correctLabel = `${correctSplits.join(' / ')} (சரியான பிரிப்பு: ${labelExplanation})`;

    const options = [
      { splits: correctSplits, isCorrect: true, label: correctLabel }
    ];

    // Generate incorrect splits
    const letters = this.tamilNLPService.splitTamilLetters(word);
    
    // Incorrect 1: Split every letter (E.g. தா / ம / ரை or க / ல் / வி)
    if (letters.length > 2) {
      const allSplit = letters.map(l => l);
      if (allSplit.join('/') !== correctSplits.join('/')) {
        options.push({
          splits: allSplit,
          isCorrect: false,
          label: allSplit.join(' / ') + ' (தவறு: அசை விதிகளைப் பின்பற்றவில்லை)'
        });
      }
    }

    // Incorrect 2: An alternative wrong split
    if (letters.length > 1) {
      const firstSplit = [letters[0], letters.slice(1).join('')];
      if (firstSplit.join('/') !== correctSplits.join('/')) {
        options.push({
          splits: firstSplit,
          isCorrect: false,
          label: firstSplit.join(' / ') + ' (தவறு: அசை வாய்பாடு பொருந்தவில்லை)'
        });
      }
    }

    if (options.length === 1) {
      options.push({
        splits: [word],
        isCorrect: false,
        label: word + ' (தவறு: அசை பிரிக்கப்படவில்லை)'
      });
    }

    return options;
  }

  initGame(): void {
    let list: DetectiveChallenge[] = [];

    let sourceChallenges = (this.activity?.challenges && this.activity.challenges.length > 0)
      ? [...this.activity.challenges]
      : [];

    sourceChallenges = sourceChallenges.sort(() => Math.random() - 0.5);
    if (sourceChallenges.length > 10) {
      sourceChallenges = sourceChallenges.slice(0, 10);
    }

    list = sourceChallenges.map((c: any) => {
      const options: any[] = [];

      // Correct option
      const correctSplits = c.correctSplits || [];
      options.push({
        splits: correctSplits,
        isCorrect: true,
        label: correctSplits.join(' / ')
      });

      // Wrong options — from manually entered wrongOptions OR incorrectSplits fallback
      const wrongOpts: string[][] = c.wrongOptions && c.wrongOptions.length > 0
        ? c.wrongOptions
        : (c.incorrectSplits ? [c.incorrectSplits] : []);

      wrongOpts.forEach((wrongSplit: string[]) => {
        options.push({
          splits: wrongSplit,
          isCorrect: false,
          label: wrongSplit.join(' / ')
        });
      });

      // Ensure every challenge has at least 4 distinct options (A, B, C, D) for students
      if (options.length < 4 && c.word) {
        const letters = this.tamilNLPService.splitTamilLetters(c.word);
        const wrongCandidates: string[][] = [
          letters, // Split every letter
          [letters[0], letters.slice(1).join('')], // Split first letter
          [letters.slice(0, -1).join(''), letters.slice(-1)[0]], // Split last letter
          [c.word], // No split
        ];

        wrongCandidates.forEach(cand => {
          if (options.length < 4) {
            const candKey = cand.join('/');
            if (!options.some(opt => opt.splits.join('/') === candKey)) {
              options.push({
                splits: cand,
                isCorrect: false,
                label: cand.join(' / ')
              });
            }
          }
        });
      }

      // Shuffle options randomly
      const shuffledOptions = [...options].sort(() => Math.random() - 0.5);

      return {
        word: c.word,
        options: shuffledOptions,
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

    const updated: DetectiveChallenge = {
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

    this.answered.emit({
      isCorrect,
      score: this.score(),
      total: this.total()
    });
  }

  nextChallenge(): void {
    const nextIdx = this.currentIndex() + 1;
    const list = this.challenges();

    if (nextIdx < list.length) {
      this.currentIndex.set(nextIdx);
      this.currentChallenge.set(list[nextIdx]);
    } else {
      // Reset & Re-shuffle
      this.initGame();
    }
  }
}
