import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ActivityRenderer, NormalizedActivity } from '../activity-renderer/activity-renderer';

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
  templateUrl: './assessment-player.html',
  styleUrls: ['./assessment-player.css']
})
export class AssessmentPlayerComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  assessmentId = signal<number | null>(null);
  assessment = signal<AssessmentData | null>(null);
  gameState = signal<'start' | 'active' | 'results' | 'error'>('start');
  errorMessage = signal<string | null>(null);

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
    this.errorMessage.set(null);

    const url = `http://localhost:8000/api/assessments/${this.assessmentId()}`;
    this.http.get<AssessmentData>(url).subscribe({
      next: (data) => {
        this.assessment.set(data);
      },
      error: (err) => {
        console.error('Failed to fetch assessment details:', err);
        this.errorMessage.set(err.status === 404 ? 'Assessment not found.' : 'Failed to load assessment details. Please try again.');
        this.gameState.set('error');
      }
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
