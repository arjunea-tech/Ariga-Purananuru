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
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }

  private synthesizeError() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }
}
