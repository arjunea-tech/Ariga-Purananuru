import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChapterData {
  id?: number;
  name: string;
  code: string;
  description?: string;
  sort_order?: number;
  is_active: boolean;
  assessments?: any[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChapterService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/chapters';

  getAll(levelId?: number): Observable<ChapterData[]> {
    let params = new HttpParams();
    if (levelId) {
      params = params.set('level_id', levelId.toString());
    }
    return this.http.get<ChapterData[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ChapterData> {
    return this.http.get<ChapterData>(`${this.apiUrl}/${id}`);
  }

  create(data: ChapterData): Observable<ChapterData> {
    return this.http.post<ChapterData>(this.apiUrl, data);
  }

  update(id: number, data: ChapterData): Observable<ChapterData> {
    return this.http.put<ChapterData>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
