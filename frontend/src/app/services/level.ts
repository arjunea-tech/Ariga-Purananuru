import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LevelData {
  id?: number;

  name: string;
  code: string;
  description?: string;
  objective_listening?: string;
  objective_speaking?: string;
  objective_reading?: string;
  objective_writing?: string;
  estimated_hours?: number;
  sort_order?: number;
  is_active: boolean;

  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LevelService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/levels';

  getAll(courseId?: number): Observable<LevelData[]> {
    let params = new HttpParams();
    if (courseId) {
      params = params.set('course_id', courseId.toString());
    }
    return this.http.get<LevelData[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<LevelData> {
    return this.http.get<LevelData>(`${this.apiUrl}/${id}`);
  }

  create(data: LevelData): Observable<LevelData> {
    return this.http.post<LevelData>(this.apiUrl, data);
  }

  update(id: number, data: LevelData): Observable<LevelData> {
    return this.http.put<LevelData>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
