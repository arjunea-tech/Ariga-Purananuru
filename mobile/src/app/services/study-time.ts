import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StudyTimeService {
  private timerInterval: any = null;

  constructor() {
    this.startTracking();
  }

  private getTodayKey(): string {
    const today = new Date().toISOString().split('T')[0];
    return `study_seconds_${today}`;
  }

  public startTracking(): void {
    if (this.timerInterval) return;

    // Track active seconds every 10 seconds
    this.timerInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const key = this.getTodayKey();
        const currentSeconds = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, (currentSeconds + 10).toString());
      }
    }, 10000);
  }

  public getTodayStudyMinutes(): number {
    const key = this.getTodayKey();
    const currentSeconds = parseInt(localStorage.getItem(key) || '0', 10);
    return Math.floor(currentSeconds / 60);
  }

  public addStudySeconds(seconds: number): void {
    const key = this.getTodayKey();
    const currentSeconds = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, (currentSeconds + seconds).toString());
  }

  public stopTracking(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
