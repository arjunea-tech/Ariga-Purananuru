import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../services/audio.service';

@Component({
  selector: 'app-yappu-alahidu-true-false',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="magic-forest-container d-flex flex-column align-items-center position-relative w-100" style="flex: 1; min-height: 100%;">
    
      <!-- Hanging Wooden Signpost (Question) -->
      <div class="wooden-signpost-wrapper mt-3 z-2">
        <div class="signpost-chain left-chain"></div>
        <div class="signpost-chain right-chain"></div>
        <div class="wooden-sign p-3 text-center shadow-lg">
          <h4 class="mb-2 text-warning fw-bold text-shadow-dark" [innerHTML]="activity.question"></h4>
          <p class="fs-6 mb-0 text-white fw-bold text-shadow-dark">{{ activity.statement }}</p>
        </div>
      </div>
    
      <!-- Forest Floor & Doors Area -->
      <div class="doors-area w-100 d-flex flex-column justify-content-end align-items-center flex-grow-1 position-relative z-1 pb-4">
    
        <div class="d-flex justify-content-center align-items-end gap-3 gap-md-5 w-100 px-3 z-1">
          <!-- True Door (Green) -->
          <div class="magic-door-container" (click)="verifyAnswer(true)">
            <div class="magic-door green-door shadow-lg"
                 [ngClass]="{
                   'door-open': isVerified() && selectedDoor() === true && isCorrect(),
                   'door-shake': isVerified() && selectedDoor() === true && !isCorrect(),
                   'door-disabled': isVerified() && selectedDoor() !== true
                 }">
              <div class="door-arch"></div>
              <div class="door-handle"></div>
              <div class="door-glow glow-green"></div>
              <span class="door-text text-success fw-bold">சரி<br><small>True</small></span>
            </div>
          </div>
    
          <!-- False Door (Red) -->
          <div class="magic-door-container" (click)="verifyAnswer(false)">
            <div class="magic-door red-door shadow-lg"
                 [ngClass]="{
                   'door-open': isVerified() && selectedDoor() === false && isCorrect(),
                   'door-shake': isVerified() && selectedDoor() === false && !isCorrect(),
                   'door-disabled': isVerified() && selectedDoor() !== false
                 }">
              <div class="door-arch"></div>
              <div class="door-handle"></div>
              <div class="door-glow glow-red"></div>
              <span class="door-text text-danger fw-bold">தவறு<br><small>False</small></span>
            </div>
          </div>
        </div>
    
        <!-- The Rabbit Mascot -->
        <div class="rabbit-mascot position-absolute z-2"
             [ngClass]="{
               'rabbit-jump-left': isVerified() && selectedDoor() === true && isCorrect(),
               'rabbit-jump-right': isVerified() && selectedDoor() === false && isCorrect(),
               'rabbit-sad': isVerified() && !isCorrect()
             }">
          🐇
        </div>
      </div>
    
      <!-- Magical Scroll Feedback -->
      @if (isVerified()) {
        <div class="magical-scroll-wrapper position-absolute bottom-0 w-100 p-2 p-md-3 z-3 animate-slide-up">
          <div class="magical-scroll text-center p-2 p-md-3 shadow-lg mx-auto" style="max-width: 500px;" [ngClass]="isCorrect() ? 'scroll-success' : 'scroll-error'">
            <h5 class="mb-1 fw-bold text-dark">
              <i class="bi" [ngClass]="isCorrect() ? 'bi-stars text-success' : 'bi-exclamation-triangle-fill text-danger'"></i>
              {{ isCorrect() ? 'சரியான விடை!' : 'ஐயையோ! தவறான விடை!' }}
            </h5>
            @if (activity.explanation) {
              <p class="mb-0 fs-7 text-dark fw-bold" style="font-size: 0.9rem;">{{ activity.explanation }}</p>
            }
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
      flex: 1;
    }
    .magic-forest-container {
      background: radial-gradient(circle at top, #2b1055 0%, #150a21 100%);
      overflow: hidden;
      padding-bottom: 130px; /* Room for scroll */
    }
    .text-shadow-dark { text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
    
    /* Wooden Signpost */
    .wooden-signpost-wrapper {
      position: relative;
      width: 90%;
      max-width: 500px;
    }
    .signpost-chain {
      width: 4px;
      height: 30px;
      background: #71717a;
      position: absolute;
      top: -30px;
      border-radius: 2px;
    }
    .left-chain { left: 15%; }
    .right-chain { right: 15%; }
    .wooden-sign {
      background: #78350f;
      border: 4px solid #451a03;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.5);
    }

    /* Magical Doors */
    .magic-door-container {
      perspective: 1000px;
      cursor: pointer;
      width: 40%;
      max-width: 150px;
      height: 180px;
    }
    .magic-door {
      width: 100%;
      height: 100%;
      position: relative;
      background: #3f3f46;
      border-radius: 60px 60px 0 0;
      border: 8px solid #27272a;
      border-bottom: 0;
      transform-origin: left;
      transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s;
      transform-style: preserve-3d;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .green-door { border-color: #065f46; background: #0f3f2b; }
    .red-door { border-color: #7f1d1d; background: #451313; }
    
    .door-arch {
      position: absolute;
      top: 10px;
      width: 80%;
      height: 80%;
      border: 2px solid rgba(255,255,255,0.1);
      border-radius: 50px 50px 0 0;
      pointer-events: none;
    }
    .door-handle {
      position: absolute;
      right: 15px;
      top: 50%;
      width: 12px;
      height: 12px;
      background: #fbbf24;
      border-radius: 50%;
      box-shadow: 1px 1px 3px rgba(0,0,0,0.5);
    }
    .door-text {
      text-align: center;
      font-size: 1.2rem;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      z-index: 2;
    }
    .door-glow {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 60px 60px 0 0;
      opacity: 0.5;
      animation: pulseGlow 2s infinite alternate;
    }
    .glow-green { box-shadow: inset 0 0 20px #10b981; }
    .glow-red { box-shadow: inset 0 0 20px #ef4444; }

    @keyframes pulseGlow {
      from { opacity: 0.4; }
      to { opacity: 0.8; }
    }

    /* Animations */
    .door-open {
      transform: rotateY(-105deg);
    }
    .door-shake {
      animation: shake 0.5s;
    }
    .door-disabled {
      filter: brightness(0.3) grayscale(0.8);
      pointer-events: none;
    }

    @keyframes shake {
      0% { transform: translateX(0); }
      20% { transform: translateX(-10px); }
      40% { transform: translateX(10px); }
      60% { transform: translateX(-10px); }
      80% { transform: translateX(10px); }
      100% { transform: translateX(0); }
    }

    /* Rabbit Mascot */
    .rabbit-mascot {
      font-size: 4rem;
      bottom: -15px;
      transition: all 0.8s ease-in-out;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));
    }
    .rabbit-jump-left {
      transform: translate(-70px, -40px) scale(0.5);
      opacity: 0;
    }
    .rabbit-jump-right {
      transform: translate(70px, -40px) scale(0.5);
      opacity: 0;
    }
    .rabbit-sad {
      transform: translateY(10px) rotate(15deg);
      filter: grayscale(1);
    }

    /* Magical Scroll */
    .magical-scroll-wrapper {
      bottom: 10px;
    }
    .magical-scroll {
      background: #fef3c7;
      border: 3px solid #d97706;
      border-radius: 4px;
      position: relative;
    }
    .magical-scroll::before, .magical-scroll::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 105%;
      top: -2.5%;
      background: #b45309;
      border-radius: 10px;
    }
    .magical-scroll::before { left: -10px; }
    .magical-scroll::after { right: -10px; }
    
    .scroll-success { box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
    .scroll-error { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }

    .animate-slide-up {
      animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(50px); }
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
  selectedDoor = signal<boolean | null>(null);

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
    
    this.selectedDoor.set(userChoice);
    const correct = userChoice === this.activity.isTrue;
    this.isCorrect.set(correct);
    this.isVerified.set(true);

    if (correct) {
      this.audioService.playSuccess();
    } else {
      this.audioService.playError();
    }

    // Emit result after delay so animation finishes
    setTimeout(() => {
      this.answered.emit({ isCorrect: correct, score: correct ? 1 : 0, total: 1 });
    }, 3500);
  }
}
