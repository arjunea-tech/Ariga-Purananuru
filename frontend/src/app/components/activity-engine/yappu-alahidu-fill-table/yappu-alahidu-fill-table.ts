import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';

export interface FillTableCell {
  value: string;
  isMissing: boolean;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface FillTableRow {
  word: FillTableCell;
  asai: FillTableCell;
  seer: FillTableCell;
}

@Component({
  selector: 'app-yappu-alahidu-fill-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fill-table-container py-4">
      <!-- Question -->
      <h3 class="text-center mb-4 text-primary fw-bold" [innerHTML]="activity.question"></h3>
      
      <p class="text-muted mb-4 fs-6 text-center">காலி இடங்களை நிரப்பக் கீழே உள்ள விருப்பங்களைத் தேர்ந்தெடுக்கவும்.</p>

      <!-- Table -->
      <div class="table-responsive rounded-4 shadow-sm border overflow-hidden mx-auto mb-4" style="max-width: 700px;">
        <table class="table table-bordered mb-0 text-center align-middle">
          <thead class="table-light">
            <tr>
              <th>சீர் (வார்த்தை)</th>
              <th>அசைப் பிரிப்பு</th>
              <th>வாய்ப்பாடு</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of tableRows(); let rIdx = index">
              <!-- Word -->
              <td>
                <span *ngIf="!row.word.isMissing" class="fw-bold fs-5">{{ row.word.value }}</span>
                <div *ngIf="row.word.isMissing" class="missing-cell" 
                     [ngClass]="getCellClass(rIdx, 'word')" (click)="setActiveCell(rIdx, 'word')">
                  {{ row.word.userAnswer || '?' }}
                </div>
              </td>
              <!-- Asai -->
              <td>
                <span *ngIf="!row.asai.isMissing" class="text-muted">{{ row.asai.value }}</span>
                <div *ngIf="row.asai.isMissing" class="missing-cell" 
                     [ngClass]="getCellClass(rIdx, 'asai')" (click)="setActiveCell(rIdx, 'asai')">
                  {{ row.asai.userAnswer || '?' }}
                </div>
              </td>
              <!-- Seer -->
              <td>
                <span *ngIf="!row.seer.isMissing" class="text-primary">{{ row.seer.value }}</span>
                <div *ngIf="row.seer.isMissing" class="missing-cell" 
                     [ngClass]="getCellClass(rIdx, 'seer')" (click)="setActiveCell(rIdx, 'seer')">
                  {{ row.seer.userAnswer || '?' }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Options Pool -->
      <div class="options-pool d-flex flex-wrap justify-content-center gap-2 mx-auto" style="max-width: 700px;" *ngIf="!isVerified()">
        <button *ngFor="let opt of activity.options"
                class="btn btn-outline-secondary rounded-pill px-4 fw-bold transition-all shadow-sm"
                [disabled]="isOptionUsed(opt)"
                (click)="fillActiveCell(opt)">
          {{ opt }}
        </button>
      </div>

      <!-- Action Button -->
      <div class="text-center mt-4" *ngIf="allFilled() && !isVerified()">
        <button class="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" (click)="verifyAnswer()">
          <i class="bi bi-check-all me-2"></i> சரிபார்
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
        <div class="mt-3" *ngIf="!isCorrect()">
          <button class="btn btn-warning rounded-pill px-4 fw-bold shadow-sm" (click)="retry()">
            <i class="bi bi-arrow-counterclockwise me-2"></i> மீண்டும் முயற்சி செய்
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .missing-cell {
      display: inline-block;
      min-width: 80px;
      min-height: 30px;
      padding: 4px 12px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: #f8f9fa;
    }
    .missing-cell.active-cell {
      border-color: var(--bs-primary);
      background: rgba(13, 110, 253, 0.1);
      box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
    }
    .missing-cell.filled-cell {
      border-style: solid;
      border-color: var(--bs-secondary);
      background: #fff;
      color: var(--bs-secondary);
      font-weight: bold;
    }
    .missing-cell.correct-cell {
      border-color: var(--bs-success);
      background: rgba(25, 135, 84, 0.1);
      color: var(--bs-success);
    }
    .missing-cell.wrong-cell {
      border-color: var(--bs-danger);
      background: rgba(220, 53, 69, 0.1);
      color: var(--bs-danger);
    }
    .options-pool button:not(:disabled):hover {
      transform: translateY(-2px);
      background-color: var(--bs-primary);
      color: white;
      border-color: var(--bs-primary);
    }
    .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class YappuAlahiduFillTableComponent implements OnInit {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();
  
  private audioService = inject(AudioService);

  tableRows = signal<FillTableRow[]>([]);
  activeRow = signal<number | null>(null);
  activeCol = signal<'word'|'asai'|'seer' | null>(null);
  
  isVerified = signal<boolean>(false);
  isCorrect = signal<boolean>(false);

  ngOnInit() {
    if (!this.activity) {
      this.activity = {
        question: 'அலகிடும் அட்டவணையை நிரப்புக:',
        rows: [
          {
            word: { value: 'அகழ்வாரைத்', isMissing: false },
            asai: { value: 'நிரை / நேர் / நேர்', isMissing: true },
            seer: { value: 'புளிமாங்காய்', isMissing: false }
          },
          {
            word: { value: 'தாங்கும்', isMissing: false },
            asai: { value: 'நேர் / நேர்', isMissing: false },
            seer: { value: 'தேமா', isMissing: true }
          }
        ],
        options: ['நேர் / நேர் / நேர்', 'தேமா', 'நிரை / நேர் / நேர்', 'புளிமா'],
        explanation: 'அகழ்வாரைத் என்பது நிரை/நேர்/நேர். தாங்கும் என்பது தேமா.'
      };
    }
    
    // Deep clone rows to avoid modifying input directly
    this.tableRows.set(JSON.parse(JSON.stringify(this.activity.rows)));
    this.findNextEmptyCell();
  }

  setActiveCell(rIdx: number, col: 'word'|'asai'|'seer') {
    if (this.isVerified()) return;
    this.activeRow.set(rIdx);
    this.activeCol.set(col);
  }

  findNextEmptyCell() {
    const rows = this.tableRows();
    for (let r = 0; r < rows.length; r++) {
      if (rows[r].word.isMissing && !rows[r].word.userAnswer) {
        this.setActiveCell(r, 'word'); return;
      }
      if (rows[r].asai.isMissing && !rows[r].asai.userAnswer) {
        this.setActiveCell(r, 'asai'); return;
      }
      if (rows[r].seer.isMissing && !rows[r].seer.userAnswer) {
        this.setActiveCell(r, 'seer'); return;
      }
    }
    this.activeRow.set(null);
    this.activeCol.set(null);
  }

  fillActiveCell(option: string) {
    const r = this.activeRow();
    const c = this.activeCol();
    if (r !== null && c !== null) {
      const rows = this.tableRows();
      rows[r][c].userAnswer = option;
      this.tableRows.set([...rows]);
      this.findNextEmptyCell();
    }
  }

  isOptionUsed(opt: string): boolean {
    const rows = this.tableRows();
    for (const r of rows) {
      if (r.word.userAnswer === opt || r.asai.userAnswer === opt || r.seer.userAnswer === opt) {
        return true;
      }
    }
    return false;
  }

  allFilled(): boolean {
    const rows = this.tableRows();
    for (const r of rows) {
      if (r.word.isMissing && !r.word.userAnswer) return false;
      if (r.asai.isMissing && !r.asai.userAnswer) return false;
      if (r.seer.isMissing && !r.seer.userAnswer) return false;
    }
    return true;
  }

  getCellClass(rIdx: number, col: 'word'|'asai'|'seer'): string {
    const cell = this.tableRows()[rIdx][col];
    if (this.isVerified()) {
      return cell.isCorrect ? 'correct-cell' : 'wrong-cell';
    }
    if (this.activeRow() === rIdx && this.activeCol() === col) return 'active-cell';
    if (cell.userAnswer) return 'filled-cell';
    return '';
  }

  verifyAnswer() {
    let allCorrect = true;
    const rows = this.tableRows();
    
    rows.forEach(r => {
      if (r.word.isMissing) { r.word.isCorrect = (r.word.userAnswer === r.word.value); if (!r.word.isCorrect) allCorrect = false; }
      if (r.asai.isMissing) { r.asai.isCorrect = (r.asai.userAnswer === r.asai.value); if (!r.asai.isCorrect) allCorrect = false; }
      if (r.seer.isMissing) { r.seer.isCorrect = (r.seer.userAnswer === r.seer.value); if (!r.seer.isCorrect) allCorrect = false; }
    });

    this.tableRows.set([...rows]);
    this.isCorrect.set(allCorrect);
    this.isVerified.set(true);

    if (allCorrect) {
      this.audioService.playSuccess();
      setTimeout(() => {
        this.answered.emit({ isCorrect: true, score: 1, total: 1 });
      }, 3500);
    } else {
      this.audioService.playError();
    }
  }

  retry() {
    this.isVerified.set(false);
    this.isCorrect.set(false);
    const rows = this.tableRows();
    rows.forEach(r => {
      if (r.word.isMissing) { r.word.userAnswer = undefined; r.word.isCorrect = undefined; }
      if (r.asai.isMissing) { r.asai.userAnswer = undefined; r.asai.isCorrect = undefined; }
      if (r.seer.isMissing) { r.seer.userAnswer = undefined; r.seer.isCorrect = undefined; }
    });
    this.tableRows.set([...rows]);
    this.findNextEmptyCell();
  }
}
