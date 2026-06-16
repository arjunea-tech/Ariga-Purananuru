import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChapterData } from './chapter';
import { LevelData } from './level';

@Injectable({
  providedIn: 'root',
})
export class LevelChapterService {
  private http = inject(HttpClient);
  private levelsApiUrl = 'http://127.0.0.1:8000/api/levels';
  private chaptersApiUrl = 'http://127.0.0.1:8000/api/chapters';

  getMappedChapters(levelId: number): Observable<ChapterData[]> {
    return this.http.get<ChapterData[]>(`${this.levelsApiUrl}/${levelId}/chapters`);
  }

  mapChapters(levelId: number, chapterIds: number[]): Observable<any> {
    return this.http.post(`${this.levelsApiUrl}/${levelId}/chapters`, {
      chapter_ids: chapterIds
    });
  }

  unmap(levelId: number, chapterId: number): Observable<any> {
    return this.http.delete(`${this.levelsApiUrl}/${levelId}/chapters/${chapterId}`);
  }

  reorder(levelId: number, orders: { chapter_id: number; sort_order: number }[]): Observable<any> {
    return this.http.post(`${this.levelsApiUrl}/${levelId}/chapters/reorder`, {
      orders: orders
    });
  }

  // Chapter-centric mapping
  getMappedLevels(chapterId: number): Observable<LevelData[]> {
    return this.http.get<LevelData[]>(`${this.chaptersApiUrl}/${chapterId}/levels`);
  }

  syncLevels(chapterId: number, levelIds: number[]): Observable<any> {
    return this.http.post(`${this.chaptersApiUrl}/${chapterId}/levels`, {
      level_ids: levelIds
    });
  }
}
