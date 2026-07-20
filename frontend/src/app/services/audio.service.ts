import { Injectable } from '@angular/core';
import { Howl } from 'howler';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private successSound: Howl;
  private errorSound: Howl;

  constructor() {
    // Initialize Howler instances
    this.successSound = new Howl({
      src: ['/assets/audio/success.mp3'],
      volume: 0.5,
      onloaderror: () => console.warn('Success audio file not found, fallback to synthesis.'),
      onplayerror: () => console.warn('Error playing success sound.')
    });

    this.errorSound = new Howl({
      src: ['/assets/audio/error.mp3'],
      volume: 0.5,
      onloaderror: () => console.warn('Error audio file not found, fallback to synthesis.'),
      onplayerror: () => console.warn('Error playing error sound.')
    });
  }

  playSuccess() {
    if (this.successSound.state() === 'loaded') {
      this.successSound.play();
    } else {
      this.synthesizeSuccess();
    }
  }

  playError() {
    if (this.errorSound.state() === 'loaded') {
      this.errorSound.play();
    } else {
      this.synthesizeError();
    }
  }

  // Fallback Audio Synthesizer (No MP3 required!)
  private synthesizeSuccess() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      // Cheerful major chord arpeggio: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch (e) {}
  }

  private synthesizeError() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      // Playful low bounce drop: G3 (196Hz), D3 (146.83Hz)
      const notes = [196.00, 146.83];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + idx * 0.1;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch (e) {}
  }
}
