import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ActivityRenderer } from './activity-renderer';

interface Option {
  id: number;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  media_url?: string;
  options: Option[];
}

interface AssessmentData {
  id: number;
  title: string;
  description?: string;
  pass_percentage: number;
  duration_minutes?: number;
  questions: Question[];
}

@Component({
  selector: 'app-assessment-player',
  standalone: true,
  imports: [CommonModule, RouterModule, ActivityRenderer],
  template: `
    <div class="assessment-player-page bg-slate-900 min-h-screen py-5 px-4 text-white">
      <div class="max-w-4xl mx-auto">
        
        <!-- ==================== START SCREEN ==================== -->
        @if (gameState() === 'start' && assessment(); as exam) {
          <div class="glass-container text-center animate-fade-in p-5 p-md-5 rounded-4 shadow-lg border border-slate-700 bg-slate-800">
            <div class="icon-header mb-4">
              <div class="circle-icon bg-blue-500 bg-opacity-20 text-blue-400">
                <i class="bi bi-patch-check fs-1"></i>
              </div>
            </div>

            <h1 class="display-6 fw-bold mb-3">{{ exam.title }}</h1>
            <p class="text-slate-300 fs-5 mb-5">{{ exam.description || 'Welcome to the evaluation. Complete this timed standalone test to assess your fluency and unlock subsequent chapters.' }}</p>

            <div class="row g-4 justify-content-center mb-5">
              <div class="col-6 col-sm-3">
                <div class="info-pill bg-slate-900 bg-opacity-50 p-3 rounded-3 border border-slate-700">
                  <div class="text-slate-400 small fw-bold uppercase tracking-wider mb-1">Questions</div>
                  <div class="fs-4 fw-bold text-blue-400">{{ exam.questions.length }}</div>
                </div>
              </div>
              <div class="col-6 col-sm-3">
                <div class="info-pill bg-slate-900 bg-opacity-50 p-3 rounded-3 border border-slate-700">
                  <div class="text-slate-400 small fw-bold uppercase tracking-wider mb-1">Duration</div>
                  <div class="fs-4 fw-bold text-amber-400">
                    {{ exam.duration_minutes ? exam.duration_minutes + ' min' : 'Untimed' }}
                  </div>
                </div>
              </div>
              <div class="col-6 col-sm-3">
                <div class="info-pill bg-slate-900 bg-opacity-50 p-3 rounded-3 border border-slate-700">
                  <div class="text-slate-400 small fw-bold uppercase tracking-wider mb-1">Passing Score</div>
                  <div class="fs-4 fw-bold text-emerald-400">{{ exam.pass_percentage }}%</div>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              class="btn-start-exam rounded-pill px-5 py-3 fw-bold fs-5 shadow-lg"
              (click)="startAttempt()">
              Start Attempt <i class="bi bi-play-fill ms-2"></i>
            </button>
          </div>
        }

        <!-- ==================== ACTIVE EXAM VIEW ==================== -->
        @if (gameState() === 'active' && assessment(); as exam) {
          <div class="active-exam-container animate-fade-in">
            <!-- Header with Countdown and Progress -->
            <div class="d-flex align-items-center justify-content-between mb-4">
              <div class="question-tracker text-slate-400 font-medium">
                Question <span class="text-white fw-bold">{{ currentQuestionIdx() + 1 }}</span> of {{ exam.questions.length }}
              </div>

              <!-- Countdown Timer -->
              @if (exam.duration_minutes) {
                <div class="timer-pill" [class.warning]="timeLeft() < 60">
                  <i class="bi bi-clock-fill me-2"></i>
                  <span>{{ formatTimeLeft() }}</span>
                </div>
              }
            </div>

            <!-- Progress Bar -->
            <div class="progress-container mb-5 bg-slate-800 rounded-pill overflow-hidden">
              <div class="progress-bar-fill" [style.width.%]="progressPercentage()"></div>
            </div>

            <!-- Question Slider Container -->
            <div class="glass-container p-4 p-md-5 rounded-4 shadow-lg border border-slate-700 bg-slate-800 mb-4">
              <app-activity-renderer
                [activity]="exam.questions[currentQuestionIdx()]"
                [showFeedback]="false"
                (answered)="onQuestionAnswered($event)">
              </app-activity-renderer>
            </div>

            <!-- Bottom Pagination controls -->
            <div class="d-flex align-items-center justify-content-between">
              <button 
                type="button" 
                class="btn-nav prev rounded-pill px-4 py-2"
                [disabled]="currentQuestionIdx() === 0"
                (click)="prevQuestion()">
                <i class="bi bi-arrow-left me-2"></i> Back
              </button>

              @if (currentQuestionIdx() < exam.questions.length - 1) {
                <button 
                  type="button" 
                  class="btn-nav next rounded-pill px-4 py-2"
                  (click)="nextQuestion()">
                  Next <i class="bi bi-arrow-right ms-2"></i>
                </button>
              } @else {
                <button 
                  type="button" 
                  class="btn-submit rounded-pill px-5 py-3 fw-bold"
                  (click)="submitAttempt()">
                  Submit Exam <i class="bi bi-send-fill ms-2"></i>
                </button>
              }
            </div>
          </div>
        }

        <!-- ==================== SCORECARD RESULTS VIEW ==================== -->
        @if (gameState() === 'results' && resultsData(); as results) {
          <div class="results-container animate-fade-in">
            <div class="glass-container p-5 rounded-4 shadow-lg border border-slate-700 bg-slate-800 text-center mb-5">
              
              <!-- Circular animated percentage progress chart -->
              <div class="percentage-chart-box mb-4">
                <svg viewBox="0 0 100 100" class="percentage-svg">
                  <circle cx="50" cy="50" r="45" class="bg-circle" />
                  <circle cx="50" cy="50" r="45" class="fg-circle" 
                          [style.stroke-dashoffset]="getStrokeDashoffset(results.score)" 
                          [style.stroke]="results.passed ? '#10b981' : '#f59e0b'" />
                </svg>
                <div class="percentage-label">
                  <span class="pct">{{ results.score }}%</span>
                  <span class="lbl">Score</span>
                </div>
              </div>

              @if (results.passed) {
                <div class="success-card mb-4 animate-scale-in">
                  <div class="badge-success bg-emerald-500 bg-opacity-20 text-emerald-400 mx-auto rounded-circle d-flex align-items-center justify-content-center" style="width: 70px; height: 70px;">
                    <i class="bi bi-trophy-fill fs-2"></i>
                  </div>
                  <h2 class="display-6 fw-bold text-emerald-400 mt-3 mb-2">Congratulations!</h2>
                  <p class="text-slate-300 fs-5">Outstanding job! You passed the evaluation with flying colors. Keep up the amazing work!</p>
                </div>
              } @else {
                <div class="fail-card mb-4 animate-scale-in">
                  <div class="badge-fail bg-amber-500 bg-opacity-20 text-amber-400 mx-auto rounded-circle d-flex align-items-center justify-content-center" style="width: 70px; height: 70px;">
                    <i class="bi bi-journal-x fs-2"></i>
                  </div>
                  <h2 class="display-6 fw-bold text-amber-400 mt-3 mb-2">Keep Practicing!</h2>
                  <p class="text-slate-300 fs-5">You're making progress, but you haven't quite met the passing score of {{ results.pass_percentage }}% yet. Review your answers and try again!</p>
                </div>
              }

              <!-- Review Questions details -->
              <div class="text-start mt-5 border-top border-slate-700 pt-4">
                <h4 class="fw-bold mb-4">Summary of Attempt</h4>
                <div class="row g-3">
                  <div class="col-6">
                    <div class="p-3 bg-slate-900 bg-opacity-40 rounded-3 border border-slate-700">
                      <div class="text-slate-400 small">Total Questions</div>
                      <div class="fs-5 fw-bold">{{ results.total_questions }}</div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="p-3 bg-slate-900 bg-opacity-40 rounded-3 border border-slate-700">
                      <div class="text-slate-400 small">Correct Answers</div>
                      <div class="fs-5 fw-bold text-emerald-400">{{ results.correct_answers }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Button actions -->
              <div class="d-flex flex-wrap gap-3 justify-content-center mt-5">
                <button 
                  type="button" 
                  class="btn-action-results retry rounded-pill px-5 py-3 fw-bold"
                  (click)="retryAssessment()">
                  <i class="bi bi-arrow-clockwise me-2"></i> Retry Attempt
                </button>
                <button 
                  type="button" 
                  class="btn-action-results course rounded-pill px-5 py-3 fw-bold"
                  (click)="goBackToCourse()">
                  <i class="bi bi-house-door me-2"></i> Back to Course
                </button>
              </div>

            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .assessment-player-page {
      background-color: #0f172a;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .glass-container {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
    }
    .circle-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-start-exam {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border: none;
      color: white;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-start-exam:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
    }
    
    /* Active timer and progress components */
    .timer-pill {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 50px;
      padding: 0.5rem 1.25rem;
      font-weight: 700;
      color: #3b82f6;
      display: flex;
      align-items: center;
    }
    .timer-pill.warning {
      border-color: #ef4444;
      color: #ef4444;
      animation: pulse 1s infinite alternate;
    }
    @keyframes pulse {
      from { transform: scale(1); }
      to { transform: scale(1.05); }
    }
    .progress-container {
      height: 8px;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #10b981);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .btn-nav {
      background: rgba(30, 41, 59, 0.8);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.2s ease;
    }
    .btn-nav:hover:not(:disabled) {
      background: #ffffff;
      color: #0f172a;
      border-color: transparent;
      transform: translateY(-2px);
    }
    .btn-nav:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .btn-submit {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      transition: all 0.3s ease;
    }
    .btn-submit:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }
    
    /* SVG Circular score percentage display */
    .percentage-chart-box {
      position: relative;
      width: 160px;
      height: 160px;
      margin: 0 auto;
    }
    .percentage-svg {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }
    .bg-circle {
      fill: none;
      stroke: rgba(255, 255, 255, 0.05);
      stroke-width: 8;
    }
    .fg-circle {
      fill: none;
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 282.7; /* 2 * PI * r (r=45) */
      transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .percentage-label {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .percentage-label .pct {
      font-size: 2.25rem;
      font-weight: 800;
      color: white;
    }
    .percentage-label .lbl {
      font-size: 0.75rem;
      color: #94a3b8;
      text-uppercase: uppercase;
      letter-spacing: 0.1em;
      margin-top: -2px;
    }
    
    .btn-action-results {
      border: none;
      transition: all 0.3s ease;
    }
    .btn-action-results.retry {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }
    .btn-action-results.retry:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
    }
    .btn-action-results.course {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn-action-results.course:hover {
      background: white;
      color: #0f172a;
      transform: translateY(-3px);
    }
    
    /* Fade animations */
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-scale-in {
      animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class AssessmentPlayerComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  assessmentId = signal<number | null>(null);
  assessment = signal<AssessmentData | null>(null);
  gameState = signal<'start' | 'active' | 'results'>('start');

  currentQuestionIdx = signal<number>(0);
  answersMap = new Map<number, number>(); // questionId -> selectedOptionId
  
  // Timer States
  timeLeft = signal<number>(0); // in seconds
  timerInterval: any = null;

  resultsData = signal<{
    score: number;
    passed: boolean;
    total_questions: number;
    correct_answers: number;
    pass_percentage: number;
  } | null>(null);

  progressPercentage = computed(() => {
    const exam = this.assessment();
    if (!exam || exam.questions.length === 0) return 0;
    return ((this.currentQuestionIdx() + 1) / exam.questions.length) * 100;
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['assessmentId']) {
        this.assessmentId.set(+params['assessmentId']);
        this.loadAssessmentDetails();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadAssessmentDetails(): void {
    if (!this.assessmentId()) return;

    const url = `http://localhost:8000/api/assessments/${this.assessmentId()}`;
    this.http.get<AssessmentData>(url).subscribe({
      next: (data) => {
        this.assessment.set(data);
      },
      error: (err) => console.error('Failed to fetch assessment details:', err)
    });
  }

  startAttempt(): void {
    const exam = this.assessment();
    if (!exam) return;

    this.gameState.set('active');
    this.currentQuestionIdx.set(0);
    this.answersMap.clear();

    if (exam.duration_minutes) {
      this.timeLeft.set(exam.duration_minutes * 60);
      this.startTimer();
    }
  }

  startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timeLeft.update(time => {
        if (time <= 1) {
          this.stopTimer();
          // Automatically trigger submit when time expires
          this.submitAttempt();
          return 0;
        }
        return time - 1;
      });
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTimeLeft(): string {
    const totalSecs = this.timeLeft();
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  onQuestionAnswered(event: any): void {
    // We capture MCQ answer selection
    if (event.type === 'mcq' && event.selectedOptionId) {
      this.answersMap.set(event.questionId, event.selectedOptionId);
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIdx() > 0) {
      this.currentQuestionIdx.update(idx => idx - 1);
    }
  }

  nextQuestion(): void {
    const exam = this.assessment();
    if (exam && this.currentQuestionIdx() < exam.questions.length - 1) {
      this.currentQuestionIdx.update(idx => idx + 1);
    }
  }

  submitAttempt(): void {
    this.stopTimer();
    const exam = this.assessment();
    if (!exam) return;

    // Build the correct structured payload for Laravel
    const answersPayload = exam.questions.map(q => {
      const selectedId = this.answersMap.get(q.id);
      return {
        question_id: q.id,
        selected_option_id: selectedId || 0
      };
    });

    const body = {
      user_id: 1, // Simulated current authenticated student ID
      answers: answersPayload
    };

    const url = `http://localhost:8000/api/assessments/${exam.id}/submit`;
    this.http.post<any>(url, body).subscribe({
      next: (res) => {
        this.resultsData.set({
          score: res.score,
          passed: res.passed,
          total_questions: res.total_questions,
          correct_answers: res.correct_answers,
          pass_percentage: res.pass_percentage
        });
        this.gameState.set('results');
      },
      error: (err) => {
        console.error('Failed to submit assessment answers:', err);
        // Fallback grading on connection error
        this.calculateLocalFallback();
      }
    });
  }

  calculateLocalFallback(): void {
    const exam = this.assessment();
    if (!exam) return;

    let correctAnswers = 0;
    exam.questions.forEach(q => {
      const selectedId = this.answersMap.get(q.id);
      const correctOpt = q.options.find(o => o.is_correct);
      if (correctOpt && correctOpt.id === selectedId) {
        correctAnswers++;
      }
    });

    const totalQuestions = exam.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = score >= exam.pass_percentage;

    this.resultsData.set({
      score,
      passed,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      pass_percentage: exam.pass_percentage
    });
    this.gameState.set('results');
  }

  getStrokeDashoffset(score: number): number {
    const circumference = 282.7; // 2 * PI * 45
    return circumference - (score / 100) * circumference;
  }

  retryAssessment(): void {
    this.gameState.set('start');
  }

  goBackToCourse(): void {
    // Navigate back to course dashboard learn page
    const exam = this.assessment();
    // Assuming level or chapter ID or learn router path
    this.router.navigate(['/learn']);
  }
}
