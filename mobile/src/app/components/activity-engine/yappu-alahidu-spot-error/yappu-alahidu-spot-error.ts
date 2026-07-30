import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';

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
    <div class="spot-error-container py-4">
      <!-- Question -->
      <h3 class="text-center mb-4 text-primary fw-bold" [innerHTML]="activity.question"></h3>
      
      <!-- Table -->
      <div class="table-responsive rounded-4 shadow-sm border overflow-hidden mx-auto" style="max-width: 600px;">
        <table class="table table-hover table-bordered mb-0 text-center align-middle">
          <thead class="table-light">
            <tr>
              <th>சீர் (வார்த்தை)</th>
              <th>அசைப் பிரிப்பு</th>
              <th>வாய்ப்பாடு</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of activity.tableData; let i = index" 
                (click)="selectRow(i)"
                class="cursor-pointer transition-all"
                [ngClass]="{
                  'table-primary': selectedRow() === i && !isVerified(),
                  'table-success': isVerified() && i === activity.errorRowIndex && isCorrect(),
                  'table-danger': isVerified() && selectedRow() === i && !isCorrect(),
                  'opacity-50': isVerified() && i !== activity.errorRowIndex && selectedRow() !== i
                }">
              <td class="fw-bold fs-5">{{ row.word }}</td>
              <td class="text-muted">{{ row.asai }}</td>
              <td class="text-primary">{{ row.seer }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Action Button -->
      <div class="text-center mt-4" *ngIf="selectedRow() !== null && !isVerified()">
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
          <p class="mb-0 fs-6" *ngIf="activity.explanation">{{ activity.explanation }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cursor-pointer { cursor: pointer; }
    .transition-all { transition: all 0.2s ease-in-out; }
    tbody tr:hover:not(.table-success):not(.table-danger) {
      background-color: rgba(13, 110, 253, 0.05) !important;
      transform: scale(1.01);
    }
    .animate-slide-up {
      animation: slideUp 0.4s ease-out forwards;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class YappuAlahiduSpotErrorComponent implements OnInit {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();
  
  private audioService = inject(AudioService);

  selectedRow = signal<number | null>(null);
  isVerified = signal<boolean>(false);
  isCorrect = signal<boolean>(false);

  ngOnInit() {
    if (!this.activity || !this.activity.tableData || this.activity.tableData.length === 0) {
      this.activity = {
        question: 'கீழ்க்காணும் அலகிடும் அட்டவணையில் எங்கு பிழை உள்ளது எனக் கண்டுபிடி:',
        tableData: [
          { word: 'அகழ்வாரைத்', asai: 'நிரை / நேர் / நேர்', seer: 'புளிமாங்காய்' },
          { word: 'தாங்கும்', asai: 'நேர் / நேர்', seer: 'தேமா' },
          { word: 'நிலம்போலத்', asai: 'நேர் / நேர் / நேர்', seer: 'தேமாங்காய்' } // Error here: நிலம் is நிரை
        ],
        errorRowIndex: 2,
        explanation: '"நிலம்போலத்" என்பது நிரை / நேர் / நேர் (புளிமாங்காய்) என வர வேண்டும். ஆனால் நேர் எனத் தவறாகக் குறிக்கப்பட்டுள்ளது.'
      };
    }
  }

  selectRow(index: number) {
    if (this.isVerified()) return;
    this.selectedRow.set(index);
  }

  verifyAnswer() {
    if (this.isVerified() || this.selectedRow() === null) return;
    
    const correct = this.selectedRow() === this.activity.errorRowIndex;
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
