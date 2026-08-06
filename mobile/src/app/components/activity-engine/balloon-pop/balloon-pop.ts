import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, signal } from '@angular/core';


export interface Balloon {
  id: string;
  text: string;
  type: 'ner' | 'nirai';
  left: number; // horizontal offset percentage (10% - 85%)
  speed: number; // animation duration in seconds (4s to 8s)
  color: string; // balloon color hex/rgba
  popped: boolean;
  blastedAtTop: boolean;
}

export interface FloatingPoint {
  id: string;
  text: string;
  left: number;
  top: number;
  color: string;
}

export interface BalloonPopData {
  id?: number;
  question: string;
  level: number; // 1, 2, or 3
  target: 'ner' | 'nirai';
  timer?: number; // default 30
  // Dynamic word lists (optional — falls back to hardcoded pools if not provided)
  nerWords?: string[];
  niraiWords?: string[];
}

const BALLOON_COLORS = [
  '#ff5964', // bright red
  '#35a7ff', // sky blue
  '#38b000', // green
  '#ffb703', // orange/yellow
  '#9d4edd', // purple
  '#ff70a6', // pink
  '#06d6a0', // mint
];

// Level 1: Single அசை words
const LEVEL1_NER = ['தா', 'பூ', 'தீ', 'கூ', 'தே', 'மா', 'யா', 'வா', 'ஓ', 'நா', 'வாழ்', 'தேன்', 'வான்', 'நாள்', 'கால்', 'தேர்', 'வேர்', 'மாண்', 'தூண்', 'பாண்', 'நீள்', 'சூல்', 'மூல்', 'தோள்', 'கோள்', 'வேல்', 'தாள்', 'கீழ்', 'மேல்', 'பால்', 'நீர்', 'தார்', 'மார்', 'சேர்', 'ஏர்', 'வீர்', 'தூர்', 'கூர்', 'பேர்', 'சீர்', 'கல்', 'மண்', 'பல்', 'வில்', 'சொல்', 'புல்', 'தண்', 'கண்', 'பண்', 'வன்'];
const LEVEL1_NIRAI = ['மகிழ்', 'பசு', 'பலா', 'வரார்', 'மழை', 'குடை', 'நிலா', 'மனை', 'தமிழ்', 'சிலை', 'நடை', 'கிளி', 'குரல்', 'மலர்', 'கடல்', 'கயல்', 'நகர்', 'கமல்', 'மனம்', 'தலை', 'வளை', 'கிளை', 'விளை', 'மலை', 'சிரல்', 'சிறை', 'அரண்', 'கனி', 'பழு', 'கவி', 'நதி', 'வழி', 'மொழி', 'பொழி', 'கழி', 'விழி', 'முகில்', 'அணில்', 'மணி', 'பனி', 'தினை', 'நிழல்', 'அமல்', 'தவம்', 'நகை', 'மகள்', 'மகன்', 'தினம்', 'வலை', 'கிளர்'];

// Level 2: Syllables from 2-அசை words (Thema, Pulima, Koovilam, Karuvilam)
const LEVEL2_NER = [
  'அம்', 'மா', 'அப்', 'பா', 'தம்', 'பி', 'கண்', 'ணன்', 'கல்', 'வி', 'செல்', 'வம்', 'பள்', 'ளி', 'நா', 'டு', 
  'வீ', 'டு', 'கா', 'டு', 'தோட்', 'டம்', 'வா', 'னம்', 'பூ', 'மி', 'நீ', 'தி', 'நன்', 'மை', 'உண்', 'மை', 
  'பா', 'டல்', 'ஆ', 'டல்', 'பேச்', 'சு', 'பாட்', 'டு', 'காற்', 'றோ', 'வாழ்', 'க', 'வெற்', 'றி', 'வீ', 'ரம்', 
  'கா', 'லம்', 'பல்', 'கு', 'மே', 'கம்', 'வு', 'தான்', 'பெய்', 'நீ', 'நல்', 'சை', 'வா', 'பேர்', 'வான்', 
  'கார்', 'நூல்', 'தேன்', 'நீர்', 'பூ', 'கோ', 'மா', 'புன்', 'வெண்', 'செம்', 'தன்', 'பொன்', 'கीழ்', 'பாற்', 
  'நீள்', 'தே', 'வாய்', 'மெய்', 'கான்', 'பால்'
];
const LEVEL2_NIRAI = [
  'புலிப்', 'அழ', 'மன', 'உல', 'நில', 'மழை', 'கன', 'நினை', 'பண', 'இட', 'அற', 'தவ', 'குண', 'சின', 'மர', 
  'புனல்', 'வழி', 'மொழி', 'விழிப்', 'நெறி', 'உயி', 'புய', 'அலை', 'மல', 'அழகு', 'முகில்', 'நிலா', 'கனல்', 
  'வனம்', 'மகன்', 'மரம்', 'நகை', 'மலர்', 'மணி', 'மனம்', 'நகர்', 'வயல்', 'கடல்', 'அணி', 'முடி', 'மழைத்', 
  'துளி', 'இள', 'புது', 'மற', 'குடி', 'உயிர்', 'நிலை', 'அடி', 'திரு', 'மகள்', 'தனி', 'மதி', 'முகம்', 
  'குரு', 'குலம்', 'இன', 'வகை', 'சுடர்', 'விழி', 'புகழ்', 'தமிழ்', 'திசை', 'தொடர்', 'பல', 'கலை', 'வளர்'
];

// Level 3: Syllables from 3-அசை words (Kachcheer, Kanichcheer)
const LEVEL3_NER = [
  'கண்', 'ணந்', 'தான்', 'கல்', 'வி', 'நல்', 'அம்', 'மா', 'கை', 'நா', 'டு', 'வா', 'நம்', 'பார்', 'வீ', 
  'ரம்', 'காண்', 'பா', 'டல்', 'கேள்', 'தம்', 'பி', 'வா', 'தோட்', 'டம்', 'போ', 'நன்', 'மை', 'செய்', 'உண்', 
  'பேச்', 'பூ', 'மி', 'மேல்', 'கா', 'லம்', 'கந்', 'கம்', 'வு', 'மெய்', 'மே', 'தான்', 'பெய்', 'யே', 'நீ', 
  'யின்', 'பல்', 'யோ', 'சை', 'ரோ', 'ரே', 'தேன்', 'காண்', 'கார்', 'போ', 'மா', 'செல்', 'புன்', 'செம்', 
  'பன்', 'சூழ்', 'பேர்', 'வெண்', 'தார்', 'நீர்', 'சூட்', 'வாழ்', 'வீழ்', 'உயிர்', 'தேர்', 'ணன்', 'நெறி', 
  'அது', 'இனி', 'கன்', 'கலை', 'மர'
];
const LEVEL3_NIRAI = [
  'அழ', 'உல', 'கன', 'நில', 'மழை', 'பண', 'மொழி', 'நெறி', 'புலி', 'அலை', 'மல', 'உயி', 'பொழில்', 'முகில்', 
  'வனம்', 'மரம்', 'நகை', 'மணி', 'நகர்', 'அழகு', 'மலர்', 'வழி', 'அணி', 'முடி', 'கடல்', 'வள', 'மழைத்', 
  'துளி', 'மதி', 'முகம்', 'திரு', 'மகள்', 'புது', 'இள', 'நிலை', 'பல', 'கலை', 'மனம்', 'அடி', 'விழி', 
  'தமிழ்', 'வகை', 'சுடர்', 'புகழ்', 'திசை', 'தொடர்', 'வளர்', 'முழுது', 'நிலா', 'குலம்', 'நுரை', 'உடல்', 
  'இதழ்', 'நதி', 'அழகு', 'அருள்'
];

@Component({
  selector: 'app-activity-balloon-pop',
  standalone: true,
  imports: [],
  templateUrl: './balloon-pop.html',
  styleUrls: ['./balloon-pop.css']
})
export class BalloonPopComponent implements OnChanges, OnDestroy {
  @Input() activity: BalloonPopData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number }>();

  // Game configuration & status signals
  gameState = signal<'start' | 'playing' | 'gameover'>('start');
  score = signal<number>(0);
  timeLeft = signal<number>(30);
  targetType = signal<'ner' | 'nirai'>('ner');
  targetLevel = signal<number>(1);
  activeBalloons = signal<Balloon[]>([]);
  floatingPoints = signal<FloatingPoint[]>([]);

  // Statistics
  correctPops = signal<number>(0);
  incorrectPops = signal<number>(0);
  missedBalloons = signal<number>(0);

  // Timers
  private gameTimerInterval: any = null;
  private spawnInterval: any = null;
  private idCounter = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.resetGame();
    }
  }

  ngOnDestroy(): void {
    this.clearIntervals();
  }

  startGame(): void {
    this.clearIntervals();
    this.gameState.set('playing');
    this.score.set(0);
    this.timeLeft.set(this.activity?.timer || 30);
    this.activeBalloons.set([]);
    this.floatingPoints.set([]);
    this.correctPops.set(0);
    this.incorrectPops.set(0);
    this.missedBalloons.set(0);

    // Set Level and Target
    if (this.activity) {
      this.targetType.set(this.activity.target || 'ner');
      this.targetLevel.set(this.activity.level || 1);
    }

    // Start Spawning balloons
    this.spawnBalloon(); // Spawn immediate first balloon
    this.spawnInterval = setInterval(() => {
      this.spawnBalloon();
    }, 1200);

    // Start Game Timer Countdown
    this.gameTimerInterval = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 1) {
          this.endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  private spawnBalloon(): void {
    if (this.gameState() !== 'playing') return;

    this.idCounter++;
    const id = `balloon-${this.idCounter}`;

    // Decide if this balloon will be a target (Ner) or distractor (Nirai)
    const isTarget = Math.random() < 0.5;
    const balloonType = isTarget ? 'ner' : 'nirai';

    // Pick text based on level and selected type
    const text = this.getRandomText(balloonType, this.targetLevel());
    const left = Math.floor(Math.random() * 75) + 10; // Between 10% and 85%
    const speed = Math.random() * 3 + 4; // Between 4s and 7s float time
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];

    const newBalloon: Balloon = {
      id,
      text,
      type: balloonType,
      left,
      speed,
      color,
      popped: false,
      blastedAtTop: false
    };

    this.activeBalloons.update(balloons => [...balloons, newBalloon]);
  }

  /**
   * Gets a random word for the balloon.
   * Priority: custom words from activity (dynamic) → hardcoded pool (fallback)
   * This matches the Letter Basket hybrid pattern.
   */
  private getRandomText(type: 'ner' | 'nirai', level: number): string {
    // 1. Check for custom dynamic words provided by the editor/seeder
    const customPool = type === 'ner'
      ? (this.activity?.nerWords || [])
      : (this.activity?.niraiWords || []);

    if (customPool.length > 0) {
      return customPool[Math.floor(Math.random() * customPool.length)];
    }

    // 2. Fall back to hardcoded level-based pools
    let pool: string[] = [];
    if (level === 1) {
      pool = type === 'ner' ? LEVEL1_NER : LEVEL1_NIRAI;
    } else if (level === 2) {
      pool = type === 'ner' ? LEVEL2_NER : LEVEL2_NIRAI;
    } else {
      pool = type === 'ner' ? LEVEL3_NER : LEVEL3_NIRAI;
    }

    if (!pool.length) return type === 'ner' ? 'தே' : 'புலி';
    return pool[Math.floor(Math.random() * pool.length)];
  }

  popBalloon(balloon: Balloon, event: MouseEvent): void {
    if (this.gameState() !== 'playing' || balloon.popped || balloon.blastedAtTop) return;

    // Mark as popped
    this.activeBalloons.update(balloons =>
      balloons.map(b => b.id === balloon.id ? { ...b, popped: true } : b)
    );

    // Get click position for floating score indicators
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left + rect.width / 4;
    const clickY = event.clientY - rect.top;

    const isCorrect = balloon.type === this.targetType();

    if (isCorrect) {
      this.score.update(s => s + 10);
      this.correctPops.update(c => c + 1);
      this.addFloatingPoint('+10', balloon.left, isCorrect);
    } else {
      this.score.update(s => Math.max(0, s - 5));
      this.incorrectPops.update(i => i + 1);
      this.addFloatingPoint('-5', balloon.left, isCorrect);
    }

    // Auto clean up after pop animation ends (500ms CSS transition)
    setTimeout(() => {
      this.removeBalloon(balloon.id);
    }, 500);
  }

  private addFloatingPoint(text: string, leftPercent: number, isCorrect: boolean): void {
    const id = `fp-${Math.random()}`;
    const newFp: FloatingPoint = {
      id,
      text,
      left: leftPercent,
      top: 50, // Float near the middle
      color: isCorrect ? '#2ec4b6' : '#e63946'
    };

    this.floatingPoints.update(fps => [...fps, newFp]);

    setTimeout(() => {
      this.floatingPoints.update(fps => fps.filter(fp => fp.id !== id));
    }, 1000);
  }

  // Called when CSS floating animation finishes (balloon reached top)
  onAnimationEnd(balloon: Balloon): void {
    if (this.gameState() !== 'playing') return;

    // If it wasn't popped by user, it reached the top!
    if (!balloon.popped && !balloon.blastedAtTop) {
      this.activeBalloons.update(balloons =>
        balloons.map(b => b.id === balloon.id ? { ...b, blastedAtTop: true } : b)
      );

      // Missed count increment
      if (balloon.type === this.targetType()) {
        this.missedBalloons.update(m => m + 1);
      }

      // Automatically pop/blast the balloon at the top ceiling and destroy it
      setTimeout(() => {
        this.removeBalloon(balloon.id);
      }, 400); // Small delay to show pop burst at top
    }
  }

  private removeBalloon(id: string): void {
    this.activeBalloons.update(balloons => balloons.filter(b => b.id !== id));
  }

  private endGame(): void {
    this.clearIntervals();
    this.gameState.set('gameover');

    // Passing threshold: 40 points
    const finalScore = this.score();
    const passed = finalScore >= 40;

    this.answered.emit({
      isCorrect: passed,
      score: finalScore
    });
  }

  resetGame(): void {
    this.clearIntervals();
    this.gameState.set('start');
    this.score.set(0);
    this.activeBalloons.set([]);
    this.floatingPoints.set([]);
    this.correctPops.set(0);
    this.incorrectPops.set(0);
    this.missedBalloons.set(0);
  }

  private clearIntervals(): void {
    if (this.gameTimerInterval) {
      clearInterval(this.gameTimerInterval);
      this.gameTimerInterval = null;
    }
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = null;
    }
  }
}
