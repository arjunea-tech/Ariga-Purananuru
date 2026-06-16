import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LevelProgress {
  level_id: number;
  name: string;
  code: string;
  sort_order: number;
  is_unlocked: boolean;
  assessment_passed: boolean;
  score: number | null;
  has_assessment: boolean;
}

export interface CourseProgress {
  course: { id: number; name: string; code: string };
  levels: LevelProgress[];
}

@Injectable({
  providedIn: 'root',
})
export class LearningProgressService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api';

  getUserProgress(userId: number, courseId: number): Observable<CourseProgress> {
    return this.http.get<CourseProgress>(`${this.apiUrl}/users/${userId}/courses/${courseId}/progress`);
  }

  checkLevelAccess(userId: number, levelId: number): Observable<{ is_unlocked: boolean; reason: string }> {
    return this.http.get<{ is_unlocked: boolean; reason: string }>(
      `${this.apiUrl}/users/${userId}/levels/${levelId}/access`
    );
  }
}
