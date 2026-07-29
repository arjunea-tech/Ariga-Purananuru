import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';

export interface KuralItem {
  id: number;
  kuralNo?: number;
  line1: string[]; // 4 Seers
  line2: string[]; // 3 Seers
  meaning: string;
  chapter?: string;
}

export interface SeerCard {
  id: number;
  text: string;
  originalIndex: number;
}

@Component({
  selector: 'app-yappu-kural-puzzle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './yappu-kural-puzzle.html',
  styleUrls: ['./yappu-kural-puzzle.css']
})
export class YappuKuralPuzzleComponent implements OnInit, OnChanges {
  private audioService = inject(AudioService);

  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  // Signals
  currentIndex = signal<number>(0);
  score = signal<number>(0);
  total = signal<number>(0);
  streak = signal<number>(0);

  currentKural = signal<KuralItem | null>(null);
  
  // Board Slots: Array of 7 items (0..3 = Line 1, 4..6 = Line 2)
  slots = signal<(SeerCard | null)[]>(Array(7).fill(null));
  
  // Pool of available jumbled cards
  poolCards = signal<SeerCard[]>([]);

  isVerified = signal<boolean>(false);
  isCorrect = signal<boolean | null>(null);
  showMeaningModal = signal<boolean>(false);
  gameCompleted = signal<boolean>(false);

  defaultDataset: KuralItem[] = [
    {
      id: 1,
      kuralNo: 1,
      line1: ['அகர', 'முதல', 'எழுத்தெல்லாம்', 'ஆதி'],
      line2: ['பகவன்', 'முதற்றே', 'உலகு'],
      meaning: 'எழுத்துக்கள் எல்லாம் அகரத்தை முதலாகக் கொண்டுள்ளன; அதுபோல உலகம் இறைவனை முதலாகக் கொண்டுள்ளது.',
      chapter: 'கடவுள் வாழ்த்து'
    },
    {
      id: 2,
      kuralNo: 391,
      line1: ['கற்க', 'கசடறக்', 'கற்பவை', 'கற்றபின்'],
      line2: ['நிற்க', 'அதற்குத்', 'தக'],
      meaning: 'கற்கத் தகுந்த நூல்களைக் குற்றமறக் கற்க வேண்டும்; கற்ற பிறகு அதன் விதிகளுக்கு ஏற்ப வாழ வேண்டும்.',
      chapter: 'கல்வி'
    },
    {
      id: 3,
      kuralNo: 26,
      line1: ['செயற்கரிய', 'செய்வார்', 'பெரியர்', 'சிறியர்'],
      line2: ['செயற்கரிய', 'செய்கலா', 'தார்'],
      meaning: 'செய்வதற்கு அரிய செயல்களைச் செய்பவரே பெரியோர்; செய்ய இயலாதவர் சிறியோர் ஆவார்.',
      chapter: 'நீத்தார் பெருமை'
    },
    {
      id: 4,
      kuralNo: 139,
      line1: ['இனிய', 'உளவாக', 'இன்னாத', 'கூறல்'],
      line2: ['கனிஇருப்பக்', 'காய்வர்ந்த', 'தற்று'],
      meaning: 'இனிய சொற்கள் இருக்கும்போது கடுமையான சொற்களைப் பேசுவது கனி இருக்கக் காயைத் தின்பது போன்றது.',
      chapter: 'இனியவை கூறல்'
    },
    {
      id: 5,
      kuralNo: 423,
      line1: ['எப்பொருள்', 'யார்யார்வாய்', 'கேட்பினும்', 'அப்பொருள்'],
      line2: ['மெய்ப்பொருள்', 'காண்பது', 'அறிவு'],
      meaning: 'எப்பொருளை யார் யார் சொல்லக் கேட்டாலும், அப்பொருளின் மெய்யான உண்மையை ஆராய்ந்து அறிவதே அறிவாகும்.',
      chapter: 'அறிவுடைமை'
    }
  ];

  shuffledKurals = signal<KuralItem[]>([]);

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
    this.currentIndex.set(0);
    this.gameCompleted.set(false);

    const rawKurals = this.activity?.kurals || this.defaultDataset;
    const shuffled = [...rawKurals].sort(() => Math.random() - 0.5);
    this.shuffledKurals.set(shuffled);

    this.loadKural();
  }

  loadKural(): void {
    const kurals = this.shuffledKurals();
    if (this.currentIndex() >= kurals.length) {
      this.gameCompleted.set(true);
      return;
    }

    const k = kurals[this.currentIndex()];
    this.currentKural.set(k);
    this.slots.set(Array(7).fill(null));
    this.isVerified.set(false);
    this.isCorrect.set(null);
    this.showMeaningModal.set(false);

    // Combine 7 seers & shuffle
    const fullSeers = [...k.line1, ...k.line2];
    const cards: SeerCard[] = fullSeers.map((text, idx) => ({
      id: idx + 1,
      text,
      originalIndex: idx
    }));

    // Shuffle pool
    const jumbled = [...cards].sort(() => Math.random() - 0.5);
    this.poolCards.set(jumbled);
  }

  // Tap a card in the pool -> Places it in first empty slot
  selectPoolCard(card: SeerCard): void {
    if (this.isVerified()) return;

    const currentSlots = [...this.slots()];
    const emptyIndex = currentSlots.findIndex(s => s === null);
    if (emptyIndex === -1) return; // All slots filled

    currentSlots[emptyIndex] = card;
    this.slots.set(currentSlots);

    // Remove from pool
    this.poolCards.set(this.poolCards().filter(c => c.id !== card.id));
  }

  // Tap a slot card -> Returns it to pool
  removeSlotCard(index: number): void {
    if (this.isVerified()) return;

    const currentSlots = [...this.slots()];
    const card = currentSlots[index];
    if (!card) return;

    currentSlots[index] = null;
    this.slots.set(currentSlots);

    // Add back to pool
    this.poolCards.set([...this.poolCards(), card]);
  }

  // Clear all slots
  resetBoard(): void {
    if (this.isVerified()) return;

    const k = this.currentKural();
    if (!k) return;

    this.slots.set(Array(7).fill(null));
    const fullSeers = [...k.line1, ...k.line2];
    const cards: SeerCard[] = fullSeers.map((text, idx) => ({
      id: idx + 1,
      text,
      originalIndex: idx
    }));
    this.poolCards.set([...cards].sort(() => Math.random() - 0.5));
  }

  // Check if filled slots match correct Kural order
  verifyKural(): void {
    const k = this.currentKural();
    if (!k) return;

    const filled = this.slots();
    if (filled.some(s => s === null)) return; // Not fully filled yet

    const expected = [...k.line1, ...k.line2];
    const actual = filled.map(s => s?.text || '');

    const isRight = expected.every((val, idx) => val === actual[idx]);
    this.isVerified.set(true);
    this.isCorrect.set(isRight);
    this.total.update(t => t + 1);

    if (isRight) {
      this.audioService.playSuccess();
      this.score.update(s => s + 1);
      this.streak.update(st => st + 1);
      this.showMeaningModal.set(true);
    } else {
      this.audioService.playError();
      this.streak.set(0);
    }

    this.answered.emit({
      isCorrect: isRight,
      score: this.score(),
      total: this.total()
    });
  }

  nextKural(): void {
    this.currentIndex.update(i => i + 1);
    this.loadKural();
  }

  restartGame(): void {
    this.initGame();
  }
}
