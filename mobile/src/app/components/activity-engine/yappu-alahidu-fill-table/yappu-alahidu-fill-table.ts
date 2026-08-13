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
    <div class="magic-orchard-container py-4 overflow-hidden position-relative" style="background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); min-height: 100%;">
    
      <!-- Header -->
      <div class="position-relative z-1">
        <h3 class="text-center mb-2 text-primary fw-bold" style="font-family: 'Nunito', sans-serif;">{{ activityData?.question || 'கீழ்க்காணும் அலகிடும் அட்டவணையை நிரப்புக:' }}</h3>
        <p class="text-muted mb-4 fs-6 text-center fw-bold px-2">சீர், அசை, வாய்ப்பாடு ஆகியவற்றைச் சரியாகப் பொருத்துக!</p>
    
        <!-- Puzzle Flow Area -->
        <div class="d-flex flex-column gap-3 mx-auto mb-5 px-2" style="max-width: 800px;">
    
          <!-- Each Row is a Card -->
          @for (row of tableRows(); track row; let rIdx = $index) {
            <div class="premium-card p-2 p-md-3 rounded-4 shadow-sm border bg-white d-flex flex-row align-items-center justify-content-between gap-1 gap-md-3 animate-pop-in"
              [style.animationDelay]="rIdx * 0.1 + 's'"
              style="border: 2px solid #e2e8f0 !important; width: 100%;">
              <!-- Word (சீர்) -->
              <div class="flow-item d-flex flex-column align-items-center flex-grow-1" style="flex-basis: 30%;">
                <span class="text-secondary fw-bold mb-1 header-label">சீர்</span>
                <div class="slot-container w-100 d-flex justify-content-center">
                  @if (!row.word.isMissing) {
                    <span class="filled-box bg-light text-dark">{{ row.word.value }}</span>
                  }
                  @if (row.word.isMissing) {
                    <div class="magic-slot"
                      [ngClass]="getCellClass(rIdx, 'word')" (click)="setActiveCell(rIdx, 'word')">
                      {{ row.word.userAnswer || '?' }}
                    </div>
                  }
                </div>
              </div>
              <!-- Arrow -->
              <div class="text-primary flow-arrow"><i class="bi bi-arrow-right-circle-fill"></i></div>
              <!-- Asai (அசை) -->
              <div class="flow-item d-flex flex-column align-items-center flex-grow-1" style="flex-basis: 35%;">
                <span class="text-secondary fw-bold mb-1 header-label">அசைப் பிரிப்பு</span>
                <div class="slot-container w-100 d-flex justify-content-center">
                  @if (!row.asai.isMissing) {
                    <span class="filled-box bg-light text-dark">{{ row.asai.value }}</span>
                  }
                  @if (row.asai.isMissing) {
                    <div class="magic-slot"
                      [ngClass]="getCellClass(rIdx, 'asai')" (click)="setActiveCell(rIdx, 'asai')">
                      {{ row.asai.userAnswer || '?' }}
                    </div>
                  }
                </div>
              </div>
              <!-- Arrow -->
              <div class="text-success flow-arrow"><i class="bi bi-arrow-right-circle-fill"></i></div>
              <!-- Seer (வாய்ப்பாடு) -->
              <div class="flow-item d-flex flex-column align-items-center flex-grow-1" style="flex-basis: 30%;">
                <span class="text-secondary fw-bold mb-1 header-label">வாய்ப்பாடு</span>
                <div class="slot-container w-100 d-flex justify-content-center">
                  @if (!row.seer.isMissing) {
                    <span class="filled-box bg-light text-primary">{{ row.seer.value }}</span>
                  }
                  @if (row.seer.isMissing) {
                    <div class="magic-slot"
                      [ngClass]="getCellClass(rIdx, 'seer')" (click)="setActiveCell(rIdx, 'seer')">
                      {{ row.seer.userAnswer || '?' }}
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
    
        <!-- Options Pool -->
        @if (!isVerified()) {
          <div class="basket-container mx-auto position-relative mt-2 p-3 p-md-4 rounded-4 shadow-sm bg-white border" style="max-width: 650px;">
            <h5 class="text-center text-dark fw-bold mb-3">விருப்பங்கள் (Options) 🧩</h5>
            <div class="d-flex flex-wrap justify-content-center gap-2 gap-md-3">
              @for (opt of options(); track opt) {
                <button
                  class="btn-magic-item fw-bold transition-all shadow-sm"
                  [disabled]="isOptionUsed(opt)"
                  (click)="fillActiveCell(opt)">
                  {{ opt }}
                </button>
              }
            </div>
          </div>
        }
    
        <!-- Action Button -->
        @if (allFilled() && !isVerified()) {
          <div class="text-center mt-4 position-relative z-1">
            <button class="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-sm hover-lift" (click)="verifyAnswer()">
              <i class="bi bi-check-all me-2"></i> சரிபார் (Verify)
            </button>
          </div>
        }
    
        <!-- Feedback -->
        @if (isVerified()) {
          <div class="mt-4 animate-slide-up text-center px-3">
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
            @if (!isCorrect()) {
              <div class="mt-3">
                <button class="btn btn-warning rounded-pill px-4 fw-bold shadow-sm hover-lift" (click)="retry()">
                  <i class="bi bi-arrow-counterclockwise me-2"></i> மீண்டும் முயற்சி செய்
                </button>
              </div>
            }
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
      width: 100%;
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

    /* Slots */
    .magic-slot {
      background: #f8fafc;
      border: 2px dashed #94a3b8;
      border-radius: 6px;
      width: 100%;
      min-height: 35px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 6px;
      font-weight: 800;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      word-break: break-word;
      font-size: clamp(0.75rem, 3vw, 1rem);
      line-height: 1.2;
    }
    
    .header-label {
      font-size: clamp(0.6rem, 2.5vw, 0.85rem);
    }
    .flow-arrow {
      font-size: clamp(1rem, 4vw, 1.5rem);
    }
    .magic-slot.active-cell {
      background: #eff6ff;
      border: 2px solid #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
      transform: scale(1.05);
      color: #1d4ed8;
      z-index: 10;
    }
    .magic-slot.filled-cell {
      background: #fff;
      border-style: solid;
      border-color: #3b82f6;
      color: #1e40af;
    }
    .magic-slot.correct-cell {
      background: #dcfce7;
      border-color: #22c55e;
      border-style: solid;
      color: #166534;
      animation: pulse-success 0.5s ease-in-out;
    }
    .magic-slot.wrong-cell {
      background: #fee2e2;
      border-color: #ef4444;
      border-style: solid;
      color: #991b1b;
      animation: shake 0.4s ease-in-out;
    }

    /* Options Item */
    .btn-magic-item {
      background: #fff;
      border: 2px solid #cbd5e1;
      border-radius: 12px;
      padding: 8px 16px;
      color: #334155;
      font-size: clamp(0.9rem, 2vw, 1.1rem);
      cursor: pointer;
    }
    .btn-magic-item:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      border-color: #3b82f6;
      color: #1d4ed8;
    }
    .btn-magic-item:not(:disabled):active {
      transform: translateY(1px);
    }
    .btn-magic-item:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f1f5f9;
    }

    .hover-lift { transition: transform 0.2s; }
    .hover-lift:hover { transform: translateY(-2px); }

    /* Animations */
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
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    @keyframes pulse-success {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); box-shadow: 0 0 20px #48bb78; }
      100% { transform: scale(1); }
    }
  `]
})
export class YappuAlahiduFillTableComponent implements OnInit {
  _activity: any;
  @Input() set activity(val: any) {
    this._activity = val;
    this.fetchRandomWords();
  }
  
  get activityData() {
    return this._activity;
  }

  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();

  private audioService = inject(AudioService);
  private activityService = inject(ActivityService);

  tableRows = signal<FillTableRow[]>([]);
  activeRow = signal<number | null>(null);
  activeCol = signal<'word' | 'asai' | 'seer' | null>(null);

  isVerified = signal<boolean>(false);
  isCorrect = signal<boolean>(false);
  options = signal<string[]>([]);
  explanation = signal<string>('');

  ngOnInit() {
    if (!this._activity) {
      this._activity = { question: 'அலகிடும் அட்டவணையை நிரப்புக:' };
    }
  }

  fetchRandomWords() {
    this.isVerified.set(false);
    this.isCorrect.set(false);
    this.tableRows.set([]);
    this.options.set([]);
    this.explanation.set('');

    this.activityService.getYappuSeerWords().subscribe({
      next: (res: any) => {
        if (res) {
          // res is grouped by seer_name: { "தேமா": [{word, hint}], "புளிமா": ... }
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
            const selected = shuffled.slice(0, 2);
            const distractors = shuffled.slice(2, 6);
            this.generatePuzzle(selected, distractors);
          }
        }
      },
      error: () => console.error('Failed to fetch words')
    });
  }

  generatePuzzle(words: any[], distractors: any[]) {
    const newRows: FillTableRow[] = [];
    const newOptions: string[] = [];
    let explText = '';

    words.forEach((w) => {
      const seer = w.seer_name;
      const asai = VAIPAADU_ASAI_MAP[seer] || w.hint; // Fallback to hint if not in map
      
      const r = Math.random();
      const hideWord = r < 0.33;
      const hideAsai = r >= 0.33 && r < 0.66;
      const hideSeer = r >= 0.66;

      if (hideWord) newOptions.push(w.word);
      if (hideAsai) newOptions.push(asai);
      if (hideSeer) newOptions.push(seer);

      newRows.push({
        word: { value: w.word, isMissing: hideWord },
        asai: { value: asai, isMissing: hideAsai },
        seer: { value: seer, isMissing: hideSeer }
      });
      
      explText += `${w.word} என்பது ${asai} (${seer}). `;
    });

    // Add 2 distractors to make it tricky
    if (distractors.length > 0) {
       newOptions.push(distractors[0].seer_name);
       newOptions.push(VAIPAADU_ASAI_MAP[distractors[1]?.seer_name] || distractors[1]?.hint);
    }

    this.options.set(newOptions.sort(() => 0.5 - Math.random()));
    this.explanation.set(explText.trim());
    this.tableRows.set(newRows);
    this.findNextEmptyCell();
  }


  setActiveCell(rIdx: number, col: 'word' | 'asai' | 'seer') {
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

  getCellClass(rIdx: number, col: 'word' | 'asai' | 'seer'): string {
    const cell = this.tableRows()[rIdx][col];
    if (this.isVerified()) {
      return cell.isCorrect ? 'correct-cell' : 'wrong-cell';
    }
    if (this.activeRow() === rIdx && this.activeCol() === col) return 'active-cell';
    if (cell.userAnswer) return 'filled-cell';
    return '';
  }

  verifyAnswer() {
    const rows = this.tableRows();
    
    if (rows.length !== 2) {
      // Fallback if not exactly 2 rows
      let allCorrect = true;
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
        }, 1000);
      } else {
        this.audioService.playError();
      }
      return;
    }

    // We have exactly 2 rows. We test the two possible mappings (0->0, 1->1) and (0->1, 1->0).
    const checkCell = (userAns: string | undefined, originalVal: string): boolean => {
      return (userAns || '').trim() === originalVal.trim();
    };

    // Mapping 1: Row 0 matches Target 0, Row 1 matches Target 1
    const m1_r0_word_correct = rows[0].word.isMissing ? checkCell(rows[0].word.userAnswer, rows[0].word.value) : true;
    const m1_r0_asai_correct = rows[0].asai.isMissing ? checkCell(rows[0].asai.userAnswer, rows[0].asai.value) : true;
    const m1_r0_seer_correct = rows[0].seer.isMissing ? checkCell(rows[0].seer.userAnswer, rows[0].seer.value) : true;
    const m1_r0_ok = m1_r0_word_correct && m1_r0_asai_correct && m1_r0_seer_correct;

    const m1_r1_word_correct = rows[1].word.isMissing ? checkCell(rows[1].word.userAnswer, rows[1].word.value) : true;
    const m1_r1_asai_correct = rows[1].asai.isMissing ? checkCell(rows[1].asai.userAnswer, rows[1].asai.value) : true;
    const m1_r1_seer_correct = rows[1].seer.isMissing ? checkCell(rows[1].seer.userAnswer, rows[1].seer.value) : true;
    const m1_r1_ok = m1_r1_word_correct && m1_r1_asai_correct && m1_r1_seer_correct;

    const m1_total_correct = m1_r0_ok && m1_r1_ok;

    // Mapping 2: Row 0 matches Target 1, Row 1 matches Target 0
    const m2_r0_word_correct = rows[0].word.isMissing ? checkCell(rows[0].word.userAnswer, rows[1].word.value) : (rows[0].word.value === rows[1].word.value);
    const m2_r0_asai_correct = rows[0].asai.isMissing ? checkCell(rows[0].asai.userAnswer, rows[1].asai.value) : (rows[0].asai.value === rows[1].asai.value);
    const m2_r0_seer_correct = rows[0].seer.isMissing ? checkCell(rows[0].seer.userAnswer, rows[1].seer.value) : (rows[0].seer.value === rows[1].seer.value);
    const m2_r0_ok = m2_r0_word_correct && m2_r0_asai_correct && m2_r0_seer_correct;

    const m2_r1_word_correct = rows[1].word.isMissing ? checkCell(rows[1].word.userAnswer, rows[0].word.value) : (rows[1].word.value === rows[0].word.value);
    const m2_r1_asai_correct = rows[1].asai.isMissing ? checkCell(rows[1].asai.userAnswer, rows[0].asai.value) : (rows[1].asai.value === rows[0].asai.value);
    const m2_r1_seer_correct = rows[1].seer.isMissing ? checkCell(rows[1].seer.userAnswer, rows[0].seer.value) : (rows[1].seer.value === rows[0].seer.value);
    const m2_r1_ok = m2_r1_word_correct && m2_r1_asai_correct && m2_r1_seer_correct;

    const m2_total_correct = m2_r0_ok && m2_r1_ok;

    // Score both mappings based on correct blanks to choose the student's intended layout
    const m1_score = (rows[0].word.isMissing && m1_r0_word_correct ? 1 : 0) +
                     (rows[0].asai.isMissing && m1_r0_asai_correct ? 1 : 0) +
                     (rows[0].seer.isMissing && m1_r0_seer_correct ? 1 : 0) +
                     (rows[1].word.isMissing && m1_r1_word_correct ? 1 : 0) +
                     (rows[1].asai.isMissing && m1_r1_asai_correct ? 1 : 0) +
                     (rows[1].seer.isMissing && m1_r1_seer_correct ? 1 : 0);

    const m2_score = (rows[0].word.isMissing && m2_r0_word_correct ? 1 : 0) +
                     (rows[0].asai.isMissing && m2_r0_asai_correct ? 1 : 0) +
                     (rows[0].seer.isMissing && m2_r0_seer_correct ? 1 : 0) +
                     (rows[1].word.isMissing && m2_r1_word_correct ? 1 : 0) +
                     (rows[1].asai.isMissing && m2_r1_asai_correct ? 1 : 0) +
                     (rows[1].seer.isMissing && m2_r1_seer_correct ? 1 : 0);

    const useMapping2 = m2_total_correct || (m2_score > m1_score && !m1_total_correct);

    let finalCorrect = false;

    if (useMapping2) {
      rows[0].word.isCorrect = m2_r0_word_correct;
      rows[0].asai.isCorrect = m2_r0_asai_correct;
      rows[0].seer.isCorrect = m2_r0_seer_correct;

      rows[1].word.isCorrect = m2_r1_word_correct;
      rows[1].asai.isCorrect = m2_r1_asai_correct;
      rows[1].seer.isCorrect = m2_r1_seer_correct;

      finalCorrect = m2_total_correct;
    } else {
      rows[0].word.isCorrect = m1_r0_word_correct;
      rows[0].asai.isCorrect = m1_r0_asai_correct;
      rows[0].seer.isCorrect = m1_r0_seer_correct;

      rows[1].word.isCorrect = m1_r1_word_correct;
      rows[1].asai.isCorrect = m1_r1_asai_correct;
      rows[1].seer.isCorrect = m1_r1_seer_correct;

      finalCorrect = m1_total_correct;
    }

    this.tableRows.set([...rows]);
    this.isCorrect.set(finalCorrect);
    this.isVerified.set(true);

    if (finalCorrect) {
      this.audioService.playSuccess();
      setTimeout(() => {
        this.answered.emit({ isCorrect: true, score: 1, total: 1 });
      }, 1000);
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
