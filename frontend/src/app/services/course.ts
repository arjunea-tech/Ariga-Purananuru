import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CourseData {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  levels?: any[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/courses';

  getAll(): Observable<CourseData[]> {
    return this.http.get<CourseData[]>(this.apiUrl);
  }

  getById(id: number): Observable<CourseData> {
    return this.http.get<CourseData>(`${this.apiUrl}/${id}`);
  }

  create(data: CourseData): Observable<CourseData> {
    return this.http.post<CourseData>(this.apiUrl, data);
  }

  update(id: number, data: CourseData): Observable<CourseData> {
    return this.http.put<CourseData>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
