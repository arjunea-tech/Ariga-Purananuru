import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LearningModeData {
  id?: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LearningModeService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/learning-modes';

  getAll(): Observable<LearningModeData[]> {
    return this.http.get<LearningModeData[]>(this.apiUrl);
  }

  getById(id: number): Observable<LearningModeData> {
    return this.http.get<LearningModeData>(`${this.apiUrl}/${id}`);
  }

  create(data: LearningModeData): Observable<LearningModeData> {
    return this.http.post<LearningModeData>(this.apiUrl, data);
  }

  update(id: number, data: LearningModeData): Observable<LearningModeData> {
    return this.http.put<LearningModeData>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
