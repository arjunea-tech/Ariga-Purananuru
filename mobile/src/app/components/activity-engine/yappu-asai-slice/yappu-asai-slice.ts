import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TamilNLPService } from '../../../services/tamil-nlp.service';
import { AudioService } from '../../../services/audio.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface YappuAsaiSliceData {
  type: 'yappu_asai_slice';
  question?: string;
  words?: string[]; // E.g., ['அகரம்', 'தாமரை', 'அறத்துப்பால்', 'கம்பராமாயணம்']
  explanation?: string;
}

export interface SliceSegment {
  text: string;
  userAsai: 'நேர்' | 'நிரை' | null;
  correctAsai: 'நேர்' | 'நிரை';
  isCorrect: boolean | null;
  ruleExplanation: string;
}

@Component({
  selector: 'app-yappu-asai-slice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './yappu-asai-slice.html',
  styleUrls: ['./yappu-asai-slice.css']
})
export class YappuAsaiSliceComponent implements OnInit, OnChanges {
  private tamilNLPService = inject(TamilNLPService);
  private audioService = inject(AudioService);
  private http = inject(HttpClient);

  @Input() activity: YappuAsaiSliceData | null = null;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  // State Signals
  wordsList = signal<string[]>([]);
  currentIndex = signal<number>(0);
  currentWord = signal<string>('');
  tamilLetters = signal<string[]>([]);
  
  // Cut positions between letters: array of booleans of length (letters.length - 1)
  // cutPositions[i] = true means a slash '/' is placed between letters[i] and letters[i+1]
  cutPositions = signal<boolean[]>([]);

  segments = signal<SliceSegment[]>([]);
  isEvaluated = signal<boolean>(false);
  isWordCorrect = signal<boolean>(false);

  score = signal<number>(0);
  total = signal<number>(0);
  streak = signal<number>(0);

  selectedRuleInfo = signal<{ segment: string; rule: string; type: string } | null>(null);

  defaultWords = [
    'தாமரை', 'கல்வி', 'அகரம்', 'கண்ணன்', 'அம்மா', 'அப்பா', 'தம்பி', 'செல்வம்', 'பள்ளி', 'நாடு',
    'வீடு', 'காடு', 'தோட்டம்', 'வானம்', 'பூமி', 'நீதி', 'நன்மை', 'உண்மை', 'பாடல்', 'ஆடல்',
    'பேச்சு', 'பாட்டு', 'வாழ்க', 'வெற்றி', 'வீரம்', 'காலம்', 'அழகு', 'மனமே', 'உலகம்', 'நிலமே',
    'கனவு', 'நினைவு', 'பணமே', 'அறமே', 'தவமே', 'குணமே', 'சினமே', 'மரமே', 'வழியே', 'மொழியே',
    'நெறிதான்', 'உயிரோ', 'கனலோ', 'புயலோ', 'அலையோ', 'மலரோ', 'பேரழகு', 'வான்மழை', 'கார்முகில்', 'செம்மொழி'
  ];

  ngOnInit(): void {
    this.initGame();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.initGame();
    }
  }

  initGame(): void {
    this.score.set(0);
    this.total.set(0);
    this.streak.set(0);

    if (this.activity?.words && this.activity.words.length > 0) {
      let shuffled = [...this.activity.words].sort(() => Math.random() - 0.5);
      if (shuffled.length > 10) {
        shuffled = shuffled.slice(0, 10);
      }
      this.wordsList.set(shuffled);
      this.currentIndex.set(0);
      this.loadWord(0);
    } else {
      // Fetch dynamic words strictly from Database via API
      this.http.get<any>(`${environment.apiUrl}/practice-words`).subscribe({
        next: (res) => {
          let dbWords: string[] = [];
          if (Array.isArray(res)) dbWords = res;
          else if (res && Array.isArray(res.data)) dbWords = res.data;
          if (dbWords.length === 0) dbWords = this.defaultWords;

          let shuffled = [...dbWords].sort(() => Math.random() - 0.5);
          if (shuffled.length > 10) {
            shuffled = shuffled.slice(0, 10);
          }
          this.wordsList.set(shuffled);
          this.currentIndex.set(0);
          if (shuffled.length > 0) {
            this.loadWord(0);
          }
        },
        error: (err) => {
          let shuffled = [...this.defaultWords].sort(() => Math.random() - 0.5).slice(0, 10);
          this.wordsList.set(shuffled);
          this.currentIndex.set(0);
          this.loadWord(0);
        }
      });
    }
  }

  loadWord(index: number): void {
    const word = this.wordsList()[index] || 'அகரம்';
    this.currentWord.set(word);
    
    const letters = this.tamilNLPService.splitTamilLetters(word);
    this.tamilLetters.set(letters);
    
    // Initialize cuts: all false
    this.cutPositions.set(new Array(Math.max(0, letters.length - 1)).fill(false));
    this.segments.set([]);
    this.isEvaluated.set(false);
    this.isWordCorrect.set(false);
    this.selectedRuleInfo.set(null);
  }

  toggleCut(index: number): void {
    if (this.isEvaluated()) return; // Don't toggle after evaluating

    const current = [...this.cutPositions()];
    current[index] = !current[index];
    this.cutPositions.set(current);
  }

  evaluateSlices(): void {
    const word = this.currentWord();
    const letters = this.tamilLetters();
    const cuts = this.cutPositions();

    // Reconstruct user's sliced segments
    const userSegmentsText: string[] = [];
    let currentChunk = letters[0];

    for (let i = 0; i < cuts.length; i++) {
      if (cuts[i]) {
        userSegmentsText.push(currentChunk);
        currentChunk = letters[i + 1];
      } else {
        currentChunk += letters[i + 1];
      }
    }
    userSegmentsText.push(currentChunk);

    // Get ground truth target slices using NLP service
    const targetAsaiGroups = this.tamilNLPService.identifyAsai(word);
    const targetSegmentsText = targetAsaiGroups.map(g => g.text);

    // Check if user slice match target slice exactly
    const isSliceMatch = userSegmentsText.length === targetSegmentsText.length &&
      userSegmentsText.every((seg, idx) => seg === targetSegmentsText[idx]);

    const evaluatedSegments: SliceSegment[] = userSegmentsText.map(segText => {
      const groups = this.tamilNLPService.identifyAsai(segText);
      const correctAsai = groups.length > 0 ? groups[0].type : 'நேர்';
      const ruleExplanation = this.getRuleExplanation(segText, correctAsai);

      return {
        text: segText,
        userAsai: null,
        correctAsai: correctAsai as 'நேர்' | 'நிரை',
        isCorrect: isSliceMatch,
        ruleExplanation
      };
    });

    this.segments.set(evaluatedSegments);
    this.isEvaluated.set(true);
    this.isWordCorrect.set(isSliceMatch);

    this.total.update(t => t + 1);

    if (isSliceMatch) {
      this.score.update(s => s + 10);
      this.streak.update(st => st + 1);
      this.audioService.playSuccess();
    } else {
      this.streak.set(0);
      this.audioService.playError();
    }

    this.answered.emit({
      isCorrect: isSliceMatch,
      score: this.score(),
      total: this.total()
    });
  }

  selectAsaiLabel(segIndex: number, type: 'நேர்' | 'நிரை'): void {
    const updated = [...this.segments()];
    if (updated[segIndex]) {
      updated[segIndex].userAsai = type;
      updated[segIndex].isCorrect = (type === updated[segIndex].correctAsai);
      this.segments.set(updated);
    }
  }

  showRuleModal(seg: SliceSegment): void {
    this.selectedRuleInfo.set({
      segment: seg.text,
      rule: seg.ruleExplanation,
      type: seg.correctAsai
    });
  }

  closeRuleModal(): void {
    this.selectedRuleInfo.set(null);
  }

  nextWord(): void {
    const nextIdx = this.currentIndex() + 1;
    if (nextIdx < this.wordsList().length) {
      this.currentIndex.set(nextIdx);
      this.loadWord(nextIdx);
    } else {
      // Re-shuffle & start fresh
      this.initGame();
    }
  }

  private getRuleExplanation(syllable: string, asaiType: string): string {
    const letters = this.tamilNLPService.splitTamilLetters(syllable);
    const count = letters.length;
    
    if (asaiType === 'நேர்') {
      if (count === 1) return 'குறில் தனித்து அல்லது நெடில் தனித்து நின்றதால் நேரசை.';
      if (count === 2) return 'குறில் ஒற்றுடன் அல்லது நெடில் ஒற்றுடன் நின்றதால் நேரசை.';
      return 'குறில்/நெடில் ஒற்றுடன் நின்ற அசை அமைப்பு (நேரசை).';
    } else { // நிரை
      if (count === 2) return 'இருக்குறில் தனித்து அல்லது குறில்-நெடில் இணைந்து நின்றதால் நிரையசை.';
      if (count >= 3) return 'இருக்குறில் ஒற்றுடன் அல்லது குறில்-நெடில் ஒற்றுடன் நின்றதால் நிரையசை.';
      return 'இருக்குறில் அல்லது குறில்-நெடில் சேர்ந்த அசை அமைப்பு (நிரையசை).';
    }
  }
}
