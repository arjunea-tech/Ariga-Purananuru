import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DialogueLine {
  role: 'system' | 'student';
  name: string;
  text: string;
  isStudentResponse?: boolean;
  options?: string[]; // multiple choices for answers if needed
}

export interface RolePlayData {
  id?: number;
  question?: string;
  dialogue: DialogueLine[];
  explanation?: string;
}

interface RenderedBubble {
  role: 'system' | 'student';
  name: string;
  text: string;
  isPendingSpeech?: boolean;
  spokenText?: string;
}

@Component({
  selector: 'app-activity-role-play',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-play.html',
  styleUrls: ['./role-play.css']
})
export class RolePlayComponent implements OnInit, OnDestroy {
  @Input() activity: RolePlayData | null = null;
  @Input() showFeedback: boolean = true;

  @Output() answered = new EventEmitter<{ isCorrect: boolean; log: any[] }>();

  renderedBubbles = signal<RenderedBubble[]>([]);
  currentLineIndex = signal<number>(0);
  isRecording = signal<boolean>(false);
  recognition: any = null;
  hasSubmitted = signal<boolean>(false);

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        this.handleStudentSpeech(resultText);
      };

      this.recognition.onend = () => {
        this.isRecording.set(false);
      };

      this.recognition.onerror = () => {
        this.isRecording.set(false);
      };
    }
  }

  ngOnInit(): void {
    this.startDialogue();
  }

  startDialogue(): void {
    this.renderedBubbles.set([]);
    this.currentLineIndex.set(0);
    this.hasSubmitted.set(false);
    this.playNextLine();
  }

  playNextLine(): void {
    if (!this.activity || !this.activity.dialogue) return;
    const lines = this.activity.dialogue;
    const index = this.currentLineIndex();

    if (index >= lines.length) {
      // Completed the dialogue!
      return;
    }

    const currentLine = lines[index];

    if (currentLine.role === 'system') {
      // System bubble - add to display
      this.renderedBubbles.update(bubbles => [
        ...bubbles,
        { role: 'system', name: currentLine.name, text: currentLine.text }
      ]);
      
      // Speak using SpeechSynthesis
      this.speakSystemLine(currentLine.text, () => {
        // After reading system line, increment and load next line
        this.currentLineIndex.update(idx => idx + 1);
        setTimeout(() => this.playNextLine(), 600);
      });
    } else {
      // Student bubble - add as pending speech input
      this.renderedBubbles.update(bubbles => [
        ...bubbles,
        { role: 'student', name: currentLine.name, text: currentLine.text, isPendingSpeech: true }
      ]);
    }
  }

  speakSystemLine(text: string, callback: () => void): void {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.95;
    utter.onend = () => callback();
    utter.onerror = () => callback(); // fallback in case of synthesis error
    window.speechSynthesis.speak(utter);
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

    this.isRecording.set(true);

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.error(e);
        this.isRecording.set(false);
      }
    } else {
      // Mock Speech fallback
      setTimeout(() => {
        if (this.isRecording()) {
          const lines = this.activity?.dialogue;
          const index = this.currentLineIndex();
          const targetText = lines ? lines[index]?.text : 'Hello';
          this.handleStudentSpeech(targetText || 'Greetings');
        }
      }, 2000);
    }
  }

  handleStudentSpeech(speechText: string): void {
    this.isRecording.set(false);
    
    // Update the last bubble (which is the pending student bubble)
    this.renderedBubbles.update(bubbles => {
      const copy = [...bubbles];
      if (copy.length > 0 && copy[copy.length - 1].role === 'student') {
        copy[copy.length - 1].isPendingSpeech = false;
        copy[copy.length - 1].spokenText = speechText;
      }
      return copy;
    });

    // Advance index
    this.currentLineIndex.update(idx => idx + 1);

    // Continue conversation or end
    setTimeout(() => {
      if (this.activity && this.currentLineIndex() < this.activity.dialogue.length) {
        this.playNextLine();
      }
    }, 800);
  }

  isDialogueComplete(): boolean {
    if (!this.activity || !this.activity.dialogue) return false;
    return this.currentLineIndex() >= this.activity.dialogue.length;
  }

  submitRolePlay(): void {
    if (this.hasSubmitted()) return;
    this.hasSubmitted.set(true);

    this.answered.emit({
      isCorrect: true, // Participation marks correct
      log: this.renderedBubbles()
    });
  }

  reset(): void {
    window.speechSynthesis.cancel();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch(e){}
    }
    this.isRecording.set(false);
    this.startDialogue();
  }

  ngOnDestroy(): void {
    window.speechSynthesis.cancel();
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onresult = null;
      try {
        this.recognition.stop();
      } catch(e){}
    }
  }
}
