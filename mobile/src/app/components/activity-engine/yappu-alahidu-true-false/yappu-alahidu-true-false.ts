import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';

@Component({
  selector: 'app-yappu-alahidu-true-false',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="true-false-container text-center py-4">
      <!-- Question -->
      <h3 class="mb-4 text-primary fw-bold" [innerHTML]="activity.question"></h3>
      
      <!-- Statement Box -->
      <div class="statement-box bg-light border rounded-4 p-4 mb-4 shadow-sm mx-auto" style="max-width: 500px;">
        <p class="fs-5 mb-0 text-dark">{{ activity.statement }}</p>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex justify-content-center gap-4 mt-4" *ngIf="!isVerified()">
        <button class="btn btn-lg btn-success rounded-pill px-5 fw-bold shadow-sm" (click)="verifyAnswer(true)">
          <i class="bi bi-check-circle me-2"></i> சரி (True)
        </button>
        <button class="btn btn-lg btn-danger rounded-pill px-5 fw-bold shadow-sm" (click)="verifyAnswer(false)">
          <i class="bi bi-x-circle me-2"></i> தவறு (False)
        </button>
      </div>

      <!-- Feedback -->
      <div *ngIf="isVerified()" class="mt-4 animate-slide-up">
        <div class="alert shadow-sm border-0" 
             [ngClass]="isCorrect() ? 'alert-success bg-success text-white' : 'alert-danger bg-danger text-white'">
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
    .statement-box {
      border: 2px solid var(--bs-primary) !important;
      background: linear-gradient(to bottom right, #f8f9fa, #ffffff) !important;
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
export class YappuAlahiduTrueFalseComponent implements OnInit {
  @Input() activity: any;
  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number; total: number }>();
  
  private audioService = inject(AudioService);

  isVerified = signal<boolean>(false);
  isCorrect = signal<boolean>(false);

  ngOnInit() {
    if (!this.activity || !this.activity.statement) {
      this.activity = {
        question: 'சரியா தவறா என கூறுக:',
        statement: 'ஒரு திருக்குறளின் கடைசி சீர் (ஈற்றுச்சீர்) நாள், மலர், காசு, பிறப்பு ஆகிய ஏதேனும் ஒன்றைக் கொண்டு முடியும்.',
        isTrue: true,
        explanation: 'வெண்பாவின் ஈற்றுச்சீர் நாள், மலர், காசு, பிறப்பு என்னும் வாய்பாடுகளில் ஒன்றைக் கொண்டு முடிவது இலக்கணம்.'
      };
    }
  }

  verifyAnswer(userChoice: boolean) {
    if (this.isVerified()) return;
    
    const correct = userChoice === this.activity.isTrue;
    this.isCorrect.set(correct);
    this.isVerified.set(true);

    if (correct) {
      this.audioService.playSuccess();
    } else {
      this.audioService.playError();
    }

    // Emit result after a short delay
    setTimeout(() => {
      this.answered.emit({ isCorrect: correct, score: correct ? 1 : 0, total: 1 });
    }, 2500);
  }
}
