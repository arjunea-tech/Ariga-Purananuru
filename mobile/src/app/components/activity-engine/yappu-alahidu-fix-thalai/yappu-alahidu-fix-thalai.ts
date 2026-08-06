import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';
import { ActivityService } from '../../../services/activity.service';

export interface ThalaiOption {
  word: string;
  isCorrect: boolean;
  explanation: string;
}

@Component({
  selector: 'app-yappu-alahidu-fix-thalai',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fix-thalai-container py-4 text-center overflow-hidden position-relative d-flex flex-column h-100" style="background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 40%, #3b82f6 100%); flex: 1; min-height: 100%;">
    
      <!-- Header -->
      <div class="position-relative z-1 mb-4">
        <h3 class="mb-2 text-primary fw-bold bg-white d-inline-block px-4 py-2 rounded-pill shadow-sm" style="font-family: 'Nunito', sans-serif;" [innerHTML]="activityData?.question || 'தளை தட்டாமல் சீரமைக்க:'"></h3>
        <p class="text-white mt-3 fs-6 fw-bold text-shadow">தளை தட்டாமல் இருக்க சரியான மரப்பலகையைத் தேர்ந்தெடுத்து பாலத்தை இணைக்கவும்! 🌉</p>
      </div>
    
      <!-- Bridge Display -->
      <div class="bridge-container position-relative mx-auto mb-5 p-2 px-md-4" style="max-width: 750px;">
        <div class="d-flex flex-nowrap justify-content-center align-items-stretch gap-1 gap-md-3 position-relative z-1 w-100">
    
          <!-- Left Cliff (First Word) -->
          <div class="cliff-block px-0 py-3 shadow-lg d-flex flex-column align-items-center justify-content-center">
            <span class="fw-bold text-white text-center cliff-text w-100 px-1">{{ activityData?.firstWord }}</span>
          </div>
    
          <!-- Missing Link (Gap) -->
          <div class="bridge-gap px-1 py-2 px-md-3 d-flex flex-column align-items-center justify-content-center position-relative">
            <!-- Ropes -->
            <div class="bridge-rope top-rope"></div>
            <div class="bridge-rope bottom-rope"></div>
    
            <div class="plank-placeholder w-100 h-100 d-flex align-items-center justify-content-center z-1"
              [ngClass]="selectedOption() !== null ? 'plank active-plank shadow-lg' : 'border-dashed-light'">
              <span class="fw-bold text-center plank-text" [ngClass]="selectedOption() !== null ? 'text-white' : 'text-light'">
                @if (selectedOption() === null) {
                  <i class="bi bi-question-circle fs-3 d-block mb-1"></i>
                }
                {{ selectedOption() !== null ? activityData?.options[selectedOption()!].word : 'விடுபட்ட பலகை' }}
              </span>
            </div>
          </div>
    
          <!-- Right Cliff (Last Word) -->
          @if (activityData?.lastWord) {
            <div class="cliff-block px-0 py-3 shadow-lg d-flex flex-column align-items-center justify-content-center">
              <span class="fw-bold text-white text-center cliff-text w-100 px-1">{{ activityData?.lastWord }}</span>
              @if (isVerified() && isCorrect()) {
                <div class="walker-icon position-absolute"><i class="bi bi-person-walking"></i></div>
              }
            </div>
          }
        </div>
      </div>
    
      <!-- Options Pool -->
      @if (!isVerified()) {
        <div class="options-grid d-flex flex-wrap justify-content-center gap-2 gap-md-3 mt-4">
          @for (opt of activityData?.options; track opt; let i = $index) {
            <button
              class="plank option-plank rounded-3 px-3 px-md-4 py-2 py-md-3 fw-bold transition-all shadow-sm d-flex flex-column align-items-center"
              [class.selected-plank]="selectedOption() === i"
              (click)="selectOption(i)">
              <span class="plank-text">{{ opt.word }}</span>
            </button>
          }
        </div>
      }
    
      <!-- Action Button -->
      @if (selectedOption() !== null && !isVerified()) {
        <div class="mt-4">
          <button class="btn btn-warning btn-lg rounded-pill px-5 fw-bold shadow-lg" style="transition: transform 0.2s; border: 2px solid #fff;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'" (click)="verifyAnswer()">
            <i class="bi bi-hammer me-2"></i> பாலத்தை இணை! (Verify)
          </button>
        </div>
      }
    
      <!-- Feedback -->
      @if (isVerified()) {
        <div class="mt-4 animate-slide-up text-center position-relative z-1 mb-5 pb-5">
          <div class="alert shadow rounded-4 p-4 text-start d-inline-block w-100"
            [ngClass]="isCorrect() ? 'alert-success' : 'alert-danger'"
            style="max-width: 600px;">
            <h4 class="alert-heading mb-2 fw-bold d-flex align-items-center gap-2">
              <i class="bi" style="font-size: 1.5rem;" [ngClass]="isCorrect() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
              {{ isCorrect() ? 'சரியான விடை!' : 'தவறான விடை!' }}
            </h4>
            <p class="mb-0 fs-6">{{ activityData?.options[selectedOption()!].explanation }}</p>
          </div>
        </div>
      }
    </div>
    `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 100%;
      width: 100%;
    }
    .fix-thalai-container {
      flex-grow: 1;
      width: 100%;
    }
    .text-shadow { text-shadow: 1px 1px 3px rgba(0,0,0,0.5); }
    
    .animate-pulse {
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { opacity: 0.4; }
      50% { opacity: 1; }
      100% { opacity: 0.4; }
    }
    
    /* Cliff Styling */
    .cliff-block {
      flex: 1 1 0;
      min-width: 0;
      background: #78350f; /* Brown dirt */
      border-top: 15px solid #16a34a; /* Green grass */
      border-radius: 8px 8px 0 0;
      min-height: 120px;
      position: relative;
    }
    
    .cliff-text {
      font-size: clamp(0.7rem, 2.5vw, 1.2rem);
      line-height: 1.1;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      word-break: break-word;
      white-space: normal;
    }
    
    /* Walker Animation */
    .walker-icon {
      font-size: clamp(1.5rem, 5vw, 2.5rem);
      color: #fff;
      top: -30px;
      left: 10px;
      animation: walkAcross 1.5s linear forwards;
    }
    @keyframes walkAcross {
      0% { transform: translateX(-150px); opacity: 0; }
      10% { opacity: 1; }
      100% { transform: translateX(20px); opacity: 1; }
    }

    /* Bridge Gap */
    .bridge-gap {
      flex: 1 1 0;
      min-width: 0;
    }
    .bridge-rope {
      position: absolute;
      width: 100%;
      height: 4px;
      background: #451a03;
      z-index: 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }
    .top-rope { top: 25%; }
    .bottom-rope { bottom: 25%; }
    
    .border-dashed-light {
      border: 3px dashed rgba(255,255,255,0.5);
      border-radius: 8px;
    }
    
    /* Plank Styling */
    .plank {
      background: #b45309; /* Wood */
      border: 2px solid #78350f;
      border-bottom: 5px solid #78350f; /* 3D effect */
      box-shadow: inset 0 2px 5px rgba(255,255,255,0.2), 0 4px 6px rgba(0,0,0,0.4);
      cursor: pointer;
    }
    
    .plank-text {
      font-size: clamp(0.7rem, 2.5vw, 1.2rem);
      word-break: break-word;
      white-space: normal;
    }
    
    .option-plank:hover {
      transform: translateY(-4px);
      background: #d97706;
    }
    
    .selected-plank {
      background: #f59e0b !important;
      border-color: #fff !important;
      transform: scale(1.05);
      box-shadow: 0 0 15px rgba(252, 211, 77, 0.8) !important;
      color: #78350f !important;
    }
    .active-plank {
      background: #d97706;
    }

    .transition-all { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class YappuAlahiduFixThalaiComponent implements OnInit {
  _activity: any;
  @Input() set activity(val: any) {
    this._activity = val;
    this.fetchRandomWords();
  }
  
  activityData: any = null;

  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();
  
  private audioService = inject(AudioService);
  private activityService = inject(ActivityService);

  selectedOption = signal<number | null>(null);
  isVerified = signal<boolean>(false);
  isCorrect = signal<boolean>(false);

  ngOnInit() {
    if (!this._activity) {
      this.fetchRandomWords();
    }
  }

  fetchRandomWords() {
    this.selectedOption.set(null);
    this.isVerified.set(false);
    this.isCorrect.set(false);

    this.activityService.getYappuSeerWords().subscribe({
      next: (res: any) => {
        if (res) {
          let allWords: any[] = [];
          Object.keys(res).forEach(seer => {
            if (Array.isArray(res[seer])) {
              // Strictly filter for Venba Thalai compatible seers
              if (seer.endsWith('மா') || seer.endsWith('விளம்') || seer.endsWith('காய்')) {
                res[seer].forEach((item: any) => {
                  allWords.push({ word: item.word, seer_name: seer });
                });
              }
            }
          });

          if (allWords.length > 0) {
            this.generatePuzzle(allWords);
          }
        }
      },
      error: () => console.error('Failed to fetch words')
    });
  }

  getStartingAsai(seerName: string): 'நேர்' | 'நிரை' {
    if (seerName.startsWith('தேமா') || seerName.startsWith('கூவிளம்')) return 'நேர்';
    if (seerName.startsWith('புளிமா') || seerName.startsWith('கருவிளம்')) return 'நிரை';
    return 'நேர்';
  }

  getRequiredNextAsai(seerName: string): 'நேர்' | 'நிரை' | null {
    if (seerName.endsWith('மா')) return 'நிரை';
    if (seerName.endsWith('விளம்') || seerName.endsWith('காய்')) return 'நேர்';
    return null;
  }

  generatePuzzle(allWords: any[]) {
    // Safety check
    if (!allWords || allWords.length < 5) return;

    // 1. Pick a random first word
    const firstWord = allWords[Math.floor(Math.random() * allWords.length)];
    const reqForMiddle = this.getRequiredNextAsai(firstWord.seer_name);
    if (!reqForMiddle) { this.generatePuzzle(allWords); return; } // Retry if bad seer
    
    // 2. Find valid middle words
    const validMiddleWords = allWords.filter(w => this.getStartingAsai(w.seer_name) === reqForMiddle);
    if (!validMiddleWords.length) { this.generatePuzzle(allWords); return; }
    
    const middleWord = validMiddleWords[Math.floor(Math.random() * validMiddleWords.length)];
    const reqForLast = this.getRequiredNextAsai(middleWord.seer_name);
    if (!reqForLast) { this.generatePuzzle(allWords); return; }

    // 3. Find valid last words
    const validLastWords = allWords.filter(w => this.getStartingAsai(w.seer_name) === reqForLast);
    if (!validLastWords.length) { this.generatePuzzle(allWords); return; }
    const lastWord = validLastWords[Math.floor(Math.random() * validLastWords.length)];

    // 4. Find wrong middle words
    const wrongMiddleWords = allWords.filter(w => this.getStartingAsai(w.seer_name) !== reqForMiddle);
    if (wrongMiddleWords.length < 2) { this.generatePuzzle(allWords); return; }
    const wrong1 = wrongMiddleWords[Math.floor(Math.random() * wrongMiddleWords.length)];
    const wrong2 = wrongMiddleWords[Math.floor(Math.random() * wrongMiddleWords.length)];

    const options = [
      { 
        word: middleWord.word, 
        isCorrect: true, 
        explanation: `சரியான விடை! '${firstWord.seer_name}' முன் '${this.getStartingAsai(middleWord.seer_name)}' வந்துள்ளதால் தளை தட்டவில்லை.` 
      },
      { 
        word: wrong1.word, 
        isCorrect: false, 
        explanation: `தவறான விடை! '${firstWord.seer_name}' முன் '${this.getStartingAsai(wrong1.seer_name)}' வரக்கூடாது. தளை தட்டுகிறது.` 
      },
      { 
        word: wrong2.word, 
        isCorrect: false, 
        explanation: `தவறான விடை! '${firstWord.seer_name}' முன் '${this.getStartingAsai(wrong2.seer_name)}' வரக்கூடாது. தளை தட்டுகிறது.` 
      }
    ];

    this.activityData = {
      question: 'தளை தட்டாமல் இருக்க நடுவில் எந்தச் சீர் வர வேண்டும்?',
      firstWord: firstWord.word,
      lastWord: lastWord.word,
      options: options.sort(() => 0.5 - Math.random()) // Shuffle options
    };
  }

  selectOption(index: number) {
    if (this.isVerified()) return;
    this.selectedOption.set(index);
  }

  verifyAnswer() {
    if (this.isVerified() || this.selectedOption() === null) return;
    
    const correct = this.activityData.options[this.selectedOption()!].isCorrect;
    this.isCorrect.set(correct);
    this.isVerified.set(true);

    if (correct) {
      this.audioService.playSuccess();
    } else {
      this.audioService.playError();
    }

    setTimeout(() => {
      this.answered.emit({ isCorrect: correct, score: correct ? 1 : 0, total: 1 });
    }, 1500);
  }
}
