import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';

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
    <div class="fix-thalai-container py-4 text-center">
      <!-- Question -->
      <h3 class="mb-4 text-primary fw-bold" [innerHTML]="activity.question"></h3>
      
      <p class="text-muted mb-4 fs-6">தளை தட்டாமல் இருக்க சரியான வார்த்தையைத் தேர்ந்தெடுக்கவும்.</p>

      <!-- Sentence Display -->
      <div class="sentence-box bg-light border rounded-4 p-4 mb-5 shadow-sm mx-auto d-flex flex-wrap justify-content-center align-items-center gap-3" style="max-width: 600px;">
        <div class="word-card bg-white px-4 py-2 rounded-3 shadow-sm border">
          <span class="fs-4 fw-bold text-dark">{{ activity.firstWord }}</span>
        </div>
        
        <div class="word-card placeholder-card px-4 py-2 rounded-3 border border-2 border-primary border-dashed"
             [ngClass]="{'bg-primary text-white border-solid': selectedOption() !== null}">
          <span class="fs-4 fw-bold">{{ selectedOption() !== null ? activity.options[selectedOption()!].word : '?' }}</span>
        </div>
        
        <div class="word-card bg-white px-4 py-2 rounded-3 shadow-sm border" *ngIf="activity.lastWord">
          <span class="fs-4 fw-bold text-dark">{{ activity.lastWord }}</span>
        </div>
      </div>

      <!-- Options -->
      <div class="options-grid d-flex flex-wrap justify-content-center gap-3" *ngIf="!isVerified()">
        <button *ngFor="let opt of activity.options; let i = index"
                class="btn btn-outline-primary btn-lg rounded-pill px-4 fw-bold transition-all shadow-sm"
                [class.active]="selectedOption() === i"
                (click)="selectOption(i)">
          {{ opt.word }}
        </button>
      </div>

      <!-- Action Button -->
      <div class="mt-4" *ngIf="selectedOption() !== null && !isVerified()">
        <button class="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" (click)="verifyAnswer()">
          <i class="bi bi-check2-circle me-2"></i> சரிபார்
        </button>
      </div>

      <!-- Feedback -->
      <div *ngIf="isVerified()" class="mt-4 animate-slide-up text-center">
        <div class="alert shadow-sm border-0 d-inline-block text-start" 
             [ngClass]="isCorrect() ? 'alert-success bg-success text-white' : 'alert-danger bg-danger text-white'"
             style="max-width: 600px;">
          <h4 class="alert-heading mb-2 fw-bold">
            <i class="bi" [ngClass]="isCorrect() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
            {{ isCorrect() ? 'சரியான விடை!' : 'தவறான விடை!' }}
          </h4>
          <p class="mb-0 fs-6">{{ activity.options[selectedOption()!].explanation }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .border-dashed { border-style: dashed !important; }
    .border-solid { border-style: solid !important; }
    .placeholder-card { min-width: 120px; min-height: 50px; display: flex; align-items: center; justify-content: center; }
    .transition-all { transition: all 0.2s ease-in-out; }
    .options-grid button:hover { transform: translateY(-2px); }
    .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class YappuAlahiduFixThalaiComponent implements OnInit {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();
  
  private audioService = inject(AudioService);

  selectedOption = signal<number | null>(null);
  isVerified = signal<boolean>(false);
  isCorrect = signal<boolean>(false);

  ngOnInit() {
    if (!this.activity) {
      this.activity = {
        question: 'தளை தட்டாமல் சீரமைக்க:',
        firstWord: 'கற்றதனால்',
        lastWord: 'பயனென்கொல்',
        options: [
          { word: 'ஆய', isCorrect: true, explanation: 'கற்றதனால் (புளிமாங்காய்) + ஆய (நேர்). காய் முன் நேர் வந்ததால் வெண்சீர் வெண்டளை. தளை தட்டவில்லை.' },
          { word: 'ஆகிய', isCorrect: false, explanation: 'கற்றதனால் (புளிமாங்காய்) + ஆகிய (நிரை). காய் முன் நிரை வந்தால் கலித்தளை ஆகிவிடும். இது குறள் வெண்பாவிற்குப் பொருந்தாது.' },
          { word: 'ஆன', isCorrect: false, explanation: 'கற்றதனால் (புளிமாங்காய்) + ஆன (நேர்). இதுவும் வெண்டளை தான் என்றாலும் குறளின் உண்மையான சொல் "ஆய" என்பதே.' }
        ]
      };
    }
  }

  selectOption(index: number) {
    if (this.isVerified()) return;
    this.selectedOption.set(index);
  }

  verifyAnswer() {
    if (this.isVerified() || this.selectedOption() === null) return;
    
    const correct = this.activity.options[this.selectedOption()!].isCorrect;
    this.isCorrect.set(correct);
    this.isVerified.set(true);

    if (correct) {
      this.audioService.playSuccess();
    } else {
      this.audioService.playError();
    }

    setTimeout(() => {
      this.answered.emit({ isCorrect: correct, score: correct ? 1 : 0, total: 1 });
    }, 3500);
  }
}
