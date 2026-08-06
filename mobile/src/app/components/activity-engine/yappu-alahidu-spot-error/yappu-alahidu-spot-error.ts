import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';
import { ActivityService } from '../../../services/activity.service';

const VAIPAADU_ASAI_MAP: Record<string, string> = {
  'தேமா': 'நேர் / நேர்',
  'புளிமா': 'நிரை / நேர்',
  'கருவிளம்': 'நிரை / நிரை',
  'கூவிளம்': 'நேர் / நிரை',
  'தேமாங்காய்': 'நேர் / நேர் / நேர்',
  'புளிமாங்காய்': 'நிரை / நேர் / நேர்',
  'கருவிளங்காய்': 'நிரை / நிரை / நேர்',
  'கூவிளங்காய்': 'நேர் / நிரை / நேர்',
  'தேமாங்கனி': 'நேர் / நேர் / நிரை',
  'புளிமாங்கனி': 'நிரை / நேர் / நிரை',
  'கருவிளங்கனி': 'நிரை / நிரை / நிரை',
  'கூவிளங்கனி': 'நேர் / நிரை / நிரை'
};

export interface AlahiduRow {
  word: string;
  asai: string;
  seer: string;
}

@Component({
  selector: 'app-yappu-alahidu-spot-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detective-container py-4 overflow-hidden position-relative" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); min-height: 100%;">
    
      <!-- Header -->
      <div class="position-relative z-1">
        <h3 class="text-center mb-2 text-primary fw-bold" style="font-family: 'Nunito', sans-serif;">
          <i class="bi bi-search me-2"></i>
          <span [innerHTML]="activityData?.question || 'கீழ்க்காணும் அலகிடும் அட்டவணையில் எந்த வரியில் பிழை உள்ளது?'"></span>
        </h3>
        <p class="text-muted mb-4 fs-6 text-center fw-bold px-2">சரியானவற்றை விட்டுவிட்டு, தவறான வரியைத் தேர்ந்தெடுக்கவும்!</p>
    
        <!-- Case Files Area -->
        <div class="d-flex flex-column gap-3 mx-auto mb-5 px-2" style="max-width: 800px;">
    
          <!-- Each Row is a Case File -->
          @for (row of tableData(); track row; let i = $index) {
            <div class="premium-card position-relative p-2 p-md-3 rounded-4 shadow-sm border bg-white d-flex flex-row align-items-center justify-content-between gap-1 gap-md-3 animate-pop-in cursor-pointer transition-all"
              [style.animationDelay]="i * 0.1 + 's'"
              (click)="selectRow(i)"
               [ngClass]="{
                 'border-primary shadow-lg scale-up': selectedRow() === i && !isVerified(),
                 'border-success bg-success-subtle': isVerified() && i === errorRowIndex() && isCorrect(),
                 'border-danger bg-danger-subtle': isVerified() && selectedRow() === i && !isCorrect(),
                 'opacity-50 grayscale': isVerified() && i !== errorRowIndex() && selectedRow() !== i
               }"
              style="border-width: 3px !important; width: 100%;">
              <!-- Word (சீர்) -->
              <div class="flow-item d-flex flex-column align-items-center flex-grow-1" style="flex-basis: 30%;">
                <span class="text-secondary fw-bold mb-1 header-label">சீர்</span>
                <div class="filled-box bg-light text-dark w-100">{{ row.word }}</div>
              </div>
              <!-- Arrow -->
              <div class="text-primary flow-arrow"><i class="bi bi-arrow-right-circle-fill"></i></div>
              <!-- Asai (அசை) -->
              <div class="flow-item d-flex flex-column align-items-center flex-grow-1" style="flex-basis: 35%;">
                <span class="text-secondary fw-bold mb-1 header-label">அசைப் பிரிப்பு</span>
                <div class="filled-box bg-light text-dark w-100">{{ row.asai }}</div>
              </div>
              <!-- Arrow -->
              <div class="text-success flow-arrow"><i class="bi bi-arrow-right-circle-fill"></i></div>
              <!-- Seer (வாய்ப்பாடு) -->
              <div class="flow-item d-flex flex-column align-items-center flex-grow-1" style="flex-basis: 30%;">
                <span class="text-secondary fw-bold mb-1 header-label">வாய்ப்பாடு</span>
                <div class="filled-box bg-light text-primary w-100">{{ row.seer }}</div>
              </div>
              <!-- Detective Stamps -->
              @if (isVerified() && i === errorRowIndex() && isCorrect()) {
                <div class="position-absolute stamp stamp-correct">
                  DETECTED
                </div>
              }
              @if (isVerified() && selectedRow() === i && !isCorrect()) {
                <div class="position-absolute stamp stamp-wrong">
                  WRONG
                </div>
              }
            </div>
          }
        </div>
    
        <!-- Action Button -->
        @if (selectedRow() !== null && !isVerified()) {
          <div class="text-center mt-4 position-relative z-1">
            <button class="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-sm" style="transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'" (click)="verifyAnswer()">
              <i class="bi bi-check2-circle me-2"></i> சரிபார்
            </button>
          </div>
        }
    
        <!-- Feedback -->
        @if (isVerified()) {
          <div class="mt-4 animate-slide-up text-center px-3 position-relative z-1">
            <div class="alert shadow-sm border-0 d-inline-block text-start rounded-4"
              [ngClass]="isCorrect() ? 'bg-success text-white' : 'bg-danger text-white'"
              style="max-width: 600px;">
              <h4 class="alert-heading mb-2 fw-bold d-flex align-items-center gap-2">
                <i class="bi" style="font-size: 1.5rem;" [ngClass]="isCorrect() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                {{ isCorrect() ? 'சரியான விடை!' : 'தவறான விடை!' }}
              </h4>
              @if (explanation()) {
                <p class="mb-0 fs-6">{{ explanation() }}</p>
              }
            </div>
          </div>
        }
      </div>
    </div>
    `,
  styles: [`
    .filled-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 35px;
      padding: 4px 6px;
      border-radius: 6px;
      font-weight: 800;
      font-size: clamp(0.75rem, 3vw, 1rem);
      border: 1px solid #e2e8f0;
      text-align: center;
      word-break: break-word;
      line-height: 1.2;
    }
    
    .header-label {
      font-size: clamp(0.6rem, 2.5vw, 0.85rem);
    }
    .flow-arrow {
      font-size: clamp(1rem, 4vw, 1.5rem);
    }

    .cursor-pointer { cursor: pointer; }
    .transition-all { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .premium-card:hover:not(.border-success):not(.border-danger) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1) !important;
      border-color: #cbd5e1 !important;
    }
    .scale-up {
      transform: scale(1.02);
      border-color: #0d6efd !important;
      background-color: #eff6ff !important;
      box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.25), 0 10px 25px rgba(13, 110, 253, 0.15) !important;
    }
    
    .scale-up .filled-box {
      background-color: #fff !important;
      border-color: #93c5fd !important;
    }
    .grayscale { filter: grayscale(100%); }

    /* Stamps */
    .stamp {
      font-family: 'Impact', fantasy;
      font-size: clamp(1.5rem, 5vw, 2.5rem);
      font-weight: 900;
      text-transform: uppercase;
      border: 4px solid;
      padding: 4px 12px;
      border-radius: 8px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      z-index: 10;
      opacity: 0.9;
      pointer-events: none;
      animation: stampIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    .stamp-correct {
      color: #15803d;
      border-color: #15803d;
      background: rgba(220, 252, 231, 0.9);
      box-shadow: 0 0 20px rgba(21, 128, 61, 0.5);
    }
    .stamp-wrong {
      color: #b91c1c;
      border-color: #b91c1c;
      background: rgba(254, 226, 226, 0.9);
      box-shadow: 0 0 20px rgba(185, 28, 28, 0.5);
    }

    /* Animations */
    @keyframes stampIn {
      0% { opacity: 0; transform: translate(-50%, -50%) rotate(-15deg) scale(3); }
      100% { opacity: 0.9; transform: translate(-50%, -50%) rotate(-15deg) scale(1); }
    }
    .animate-pop-in { animation: popIn 0.4s ease-out both; }
    @keyframes popIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class YappuAlahiduSpotErrorComponent implements OnInit {
  _activity: any;
  @Input() set activity(val: any) {
    this._activity = val;
    this.fetchRandomWords();
  }
  get activityData() { return this._activity; }

  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();
  
  private audioService = inject(AudioService);
  private activityService = inject(ActivityService);

  tableData = signal<AlahiduRow[]>([]);
  errorRowIndex = signal<number>(0);
  explanation = signal<string>('');

  selectedRow = signal<number | null>(null);
  isVerified = signal<boolean>(false);
  isCorrect = signal<boolean>(false);

  ngOnInit() {
    if (!this._activity) {
      this._activity = { question: 'கீழ்க்காணும் அலகிடும் அட்டவணையில் எந்த வரியில் பிழை உள்ளது?' };
    }
  }

  fetchRandomWords() {
    this.selectedRow.set(null);
    this.isVerified.set(false);
    this.isCorrect.set(false);
    this.tableData.set([]);
    this.explanation.set('');

    this.activityService.getYappuSeerWords().subscribe({
      next: (res: any) => {
        if (res) {
          let allWords: any[] = [];
          Object.keys(res).forEach(seer => {
            if (Array.isArray(res[seer])) {
              res[seer].forEach((item: any) => {
                allWords.push({ word: item.word, hint: item.hint, seer_name: seer });
              });
            }
          });

          if (allWords.length > 0) {
            const shuffled = allWords.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3);
            const distractor = shuffled[3]; // Used for wrong vaipaadu
            this.generatePuzzle(selected, distractor);
          }
        }
      },
      error: () => console.error('Failed to fetch words')
    });
  }

  generatePuzzle(words: any[], distractor: any) {
    const newRows: AlahiduRow[] = [];
    
    words.forEach(w => {
      newRows.push({
        word: w.word,
        asai: VAIPAADU_ASAI_MAP[w.seer_name] || w.hint,
        seer: w.seer_name
      });
    });

    const errorIndex = Math.floor(Math.random() * 3);
    const correctSeer = newRows[errorIndex].seer;
    const wrongSeer = distractor ? distractor.seer_name : (correctSeer === 'தேமா' ? 'புளிமா' : 'தேமா');
    
    newRows[errorIndex].seer = wrongSeer;

    this.errorRowIndex.set(errorIndex);
    this.tableData.set(newRows);
    this.explanation.set(`"${newRows[errorIndex].word}" என்பது ${newRows[errorIndex].asai} (${correctSeer}) என வர வேண்டும். ஆனால் ${wrongSeer} எனத் தவறாகக் குறிக்கப்பட்டுள்ளது.`);
  }

  selectRow(index: number) {
    if (this.isVerified()) return;
    this.selectedRow.set(index);
  }

  verifyAnswer() {
    if (this.isVerified() || this.selectedRow() === null) return;
    
    const correct = this.selectedRow() === this.errorRowIndex();
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
