import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';


export interface SpeakingData {
  id?: number;
  question?: string;
  targetText?: string;
  imageUrl?: string;
  explanation?: string;
}

@Component({
  selector: 'app-activity-speaking',
  standalone: true,
  imports: [],
  templateUrl: './speaking.html',
  styleUrls: ['./speaking.css']
})
export class SpeakingComponent implements OnDestroy, OnChanges {
  @Input() activity: SpeakingData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ isCorrect: boolean; score: number | null; transcript: string }>();

  recognition: any = null;
  transcript = signal<string>('');
  isRecording = signal<boolean>(false);
  isPlaying = signal<boolean>(false);
  matchScore = signal<number | null>(null);
  hasSubmitted = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity']) {
      this.reset();
    }
  }

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        this.transcript.set(resultText);
        this.evaluateSpeech(resultText);
      };

      this.recognition.onend = () => {
        this.isRecording.set(false);
      };

      this.recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        this.isRecording.set(false);
      };
    }
  }

  toggleRecording(): void {
    if (this.isRecording()) {
      if (this.recognition) {
        this.recognition.stop();
      } else {
        this.isRecording.set(false);
      }
      return;
    }

    this.transcript.set('');
    this.matchScore.set(null);
    this.isRecording.set(true);

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
        this.isRecording.set(false);
      }
    } else {
      // Mock recording fallback
      setTimeout(() => {
        if (this.isRecording()) {
          this.isRecording.set(false);
          const mockText = this.activity?.targetText || 'Sample recorded speech';
          this.transcript.set(mockText);
          this.matchScore.set(85);
        }
      }, 2500);
    }
  }

  playSample(): void {
    if (!this.activity?.targetText) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(this.activity.targetText);
    utter.lang = 'en-US';

    utter.onend = () => this.isPlaying.set(false);
    utter.onerror = () => this.isPlaying.set(false);

    this.isPlaying.set(true);
    window.speechSynthesis.speak(utter);
  }

  evaluateSpeech(spoken: string): void {
    if (!this.activity?.targetText) {
      this.matchScore.set(100);
      return;
    }
    const cleanSpoken = spoken.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    const cleanTarget = this.activity.targetText.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");

    if (cleanSpoken === cleanTarget) {
      this.matchScore.set(100);
      return;
    }

    // Word-level matching
    const spokenWords = cleanSpoken.split(/\s+/);
    const targetWords = cleanTarget.split(/\s+/);

    let matches = 0;
    targetWords.forEach(w => {
      if (spokenWords.includes(w)) {
        matches++;
      }
    });

    const score = Math.round((matches / targetWords.length) * 100);
    this.matchScore.set(score);
  }

  submitAnswer(): void {
    if (this.hasSubmitted()) return;
    this.hasSubmitted.set(true);

    this.answered.emit({
      isCorrect: (this.matchScore() ?? 0) >= 60,
      score: this.matchScore(),
      transcript: this.transcript()
    });
  }

  reset(): void {
    this.transcript.set('');
    this.isRecording.set(false);
    this.isPlaying.set(false);
    this.matchScore.set(null);
    this.hasSubmitted.set(false);
    window.speechSynthesis.cancel();
  }

  ngOnDestroy(): void {
    window.speechSynthesis.cancel();
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onresult = null;
      try {
        this.recognition.stop();
      } catch (e) { }
    }
  }
}
