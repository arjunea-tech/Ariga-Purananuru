import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StudyTimeService {
  private timerInterval: any = null;
  // In-memory only — no localStorage. Authoritative data is in the database.
  private sessionSeconds = 0;

  constructor() {
    this.startTracking();
  }

  public startTracking(): void {
    if (this.timerInterval) return;

    // Accumulate active seconds in memory every 10 seconds
    this.timerInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.sessionSeconds += 10;
      }
    }, 10000);
  }

  public getTodayStudyMinutes(): number {
    return Math.floor(this.sessionSeconds / 60);
  }

  public addStudySeconds(seconds: number): void {
    this.sessionSeconds += seconds;
  }

  public stopTracking(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
