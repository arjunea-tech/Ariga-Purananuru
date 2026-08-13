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
      <h3 class="mb-3 text-primary fw-bold" [innerHTML]="activity?.question || 'தளை தட்டாமல் சீரமைக்க:'"></h3>
      <p class="text-muted mb-3 fs-6">தளை தட்டாமல் இருக்க சரியான வார்த்தையைத் தேர்ந்தெடுக்கவும்.</p>
    
      <!-- Rule Hint Pill -->
      @if (getFirstWordSeer()) {
        <div class="rule-hint-pill bg-light text-dark px-3 py-2 rounded-pill shadow-sm mx-auto mb-4 d-inline-flex align-items-center gap-2 border border-2 border-primary" style="font-size: 0.9rem;">
          <span class="badge bg-primary text-white">💡 குறிப்பு (Rule)</span>
          <span><strong>{{ activity?.firstWord }}</strong> ({{ getFirstWordSeer() }}) ➔ <strong>{{ getRequiredRuleText() }}</strong></span>
        </div>
      }

      <!-- Sentence Display -->
      <div class="sentence-box bg-light border rounded-4 p-4 mb-5 shadow-sm mx-auto d-flex flex-wrap justify-content-center align-items-center gap-3" style="max-width: 650px;">
        <div class="word-card bg-white px-4 py-3 rounded-3 shadow-sm border d-flex flex-column align-items-center">
          <span class="fs-4 fw-bold text-dark">{{ activity?.firstWord }}</span>
          @if (getFirstWordSeer()) {
            <span class="badge bg-warning text-dark mt-1 px-2 py-1 rounded-pill" style="font-size: 0.75rem;">
              🏷️ {{ getFirstWordSeer() }}
            </span>
          }
        </div>
    
        <div class="word-card placeholder-card px-4 py-3 rounded-3 border border-2 border-primary border-dashed d-flex flex-column align-items-center"
          [ngClass]="{'bg-primary text-white border-solid': selectedOption() !== null}">
          <span class="fs-4 fw-bold">{{ selectedOption() !== null ? activity?.options[selectedOption()!].word : '?' }}</span>
          @if (selectedOption() !== null && getOptionSeer(activity?.options[selectedOption()!])) {
            <span class="badge bg-light text-dark mt-1 px-2 py-1 rounded-pill" style="font-size: 0.75rem;">
              🏷️ {{ getOptionSeer(activity?.options[selectedOption()!]) }}
            </span>
          }
        </div>
    
        @if (activity?.lastWord) {
          <div class="word-card bg-white px-4 py-3 rounded-3 shadow-sm border d-flex flex-column align-items-center">
            <span class="fs-4 fw-bold text-dark">{{ activity?.lastWord }}</span>
            @if (getLastWordSeer()) {
              <span class="badge bg-warning text-dark mt-1 px-2 py-1 rounded-pill" style="font-size: 0.75rem;">
                🏷️ {{ getLastWordSeer() }}
              </span>
            }
          </div>
        }
      </div>
    
      <!-- Options -->
      @if (!isVerified()) {
        <div class="options-grid d-flex flex-wrap justify-content-center gap-3">
          @for (opt of activity?.options; track opt; let i = $index) {
            <button
              class="btn btn-outline-primary btn-lg rounded-4 px-4 py-2.5 fw-bold transition-all shadow-sm d-flex flex-column align-items-center"
              [class.active]="selectedOption() === i"
              (click)="selectOption(i)">
              <span class="fs-5">{{ opt.word }}</span>
              @if (getOptionSeer(opt)) {
                <span class="badge bg-light text-dark opacity-90 mt-1 px-2 py-0.5 rounded-pill border border-secondary" style="font-size: 0.75rem;">
                  🏷️ {{ getOptionSeer(opt) }}
                </span>
              }
            </button>
          }
        </div>
      }
    
      <!-- Action Button -->
      @if (selectedOption() !== null && !isVerified()) {
        <div class="mt-4">
          <button class="btn btn-primary rounded-pill px-5 py-2.5 fw-bold shadow-sm" (click)="verifyAnswer()">
            <i class="bi bi-check2-circle me-2"></i> சரிபார்
          </button>
        </div>
      }
    
      <!-- Feedback -->
      @if (isVerified()) {
        <div class="mt-4 animate-slide-up text-center">
          <div class="alert shadow-sm border-0 d-inline-block text-start p-4 rounded-4"
            [ngClass]="isCorrect() ? 'alert-success bg-success text-white' : 'alert-danger bg-danger text-white'"
            style="max-width: 600px;">
            <h4 class="alert-heading mb-2 fw-bold">
              <i class="bi" [ngClass]="isCorrect() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
              {{ isCorrect() ? 'சரியான விடை!' : 'தவறான விடை!' }}
            </h4>
            <p class="mb-0 fs-6">{{ activity?.options[selectedOption()!].explanation }}</p>
          </div>
        </div>
      }
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
          { word: 'ஆய', seer: 'தேமா', isCorrect: true, explanation: 'கற்றதனால் (புளிமாங்காய்) + ஆய (தேமா / நேர் அசை). காய் முன் நேர் வந்ததால் வெண்சீர் வெண்டளை. தளை தட்டவில்லை.' },
          { word: 'ஆகிய', seer: 'புளிமா', isCorrect: false, explanation: 'கற்றதனால் (புளிமாங்காய்) + ஆகிய (புளிமா / நிரை அசை). காய் முன் நிரை வந்தால் கலித்தளை ஆகிவிடும்.' },
          { word: 'ஆன', seer: 'தேமா', isCorrect: false, explanation: 'கற்றதனால் (புளிமாங்காய்) + ஆன (தேமா / நேர் அசை). குறளின் உண்மையான சொல் "ஆய" என்பதே.' }
        ]
      };
    }
  }

  getFirstWordSeer(): string {
    if (this.activity?.firstWordSeer) return this.activity.firstWordSeer;
    return this.getSeerName(this.activity?.firstWord);
  }

  getLastWordSeer(): string {
    if (this.activity?.lastWordSeer) return this.activity.lastWordSeer;
    return this.getSeerName(this.activity?.lastWord);
  }

  getOptionSeer(opt: any): string {
    if (!opt) return '';
    if (opt.seer) return opt.seer;
    if (opt.seer_name) return opt.seer_name;
    return this.getSeerName(opt.word);
  }

  getRequiredRuleText(): string {
    const seer = this.getFirstWordSeer();
    if (!seer) return 'சரியான சீர் பெற வேண்டும்';
    if (seer.endsWith('மா')) return "'நிரை' அசையில் தொடங்கும் சீர் சேர வேண்டும் (மாமுன் நிரை)";
    if (seer.endsWith('விளம்')) return "'நேர்' அசையில் தொடங்கும் சீர் சேர வேண்டும் (விளம்முன் நேர்)";
    if (seer.endsWith('காய்')) return "'நேர்' அசையில் தொடங்கும் சீர் சேர வேண்டும் (காய்முன் நேர்)";
    return 'சரியான சீர் சேர வேண்டும்';
  }

  getSeerName(word: string): string {
    if (!word) return '';
    const clean = word.trim();

    const knownMap: Record<string, string> = {
      'மழைத்துளிகள்': 'கருவிளங்காய்',
      'கார்குழல்': 'கூவிளம்',
      'தீப்பொறி': 'தேமா',
      'அலைபாயுது': 'புளிமாங்காய்',
      'சிறுநகை': 'கருவிளம்',
      'கற்றதனால்': 'புளிமாங்காய்',
      'ஆய': 'தேமா',
      'ஆகிய': 'புளிமா',
      'ஆன': 'தேமா',
      'அறவாழி': 'கருவிளம்',
      'அந்தணன்': 'கூவிளம்',
      'தாள்சேர்ந்தார்க்கு': 'கருவிளங்காய்',
      'அல்லால்': 'தேமா',
      'பிறவாழி': 'கருவிளம்',
      'நீந்தல்': 'தேமா',
      'அரிது': 'புளிமா',
      'துப்பார்க்குத்': 'தேமாங்காய்',
      'துப்பாய': 'தேமாங்காய்',
      'துப்பாக்கித்': 'தேமாங்காய்',
      'துப்பாய தூஉம்': 'கருவிளங்காய்'
    };

    if (knownMap[clean]) return knownMap[clean];
    if (clean.endsWith('ங்காய்') || clean.endsWith('க்காய்') || clean.endsWith('ற்காய்')) return 'காய் சீர்';
    return '';
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
