import { environment } from '../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CourseData {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  price?: number;
  original_price?: number;
  cover_image?: string;
  tags?: string[];
  levels?: any[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/courses`;
  public cachedStructure: any = null;

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

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadCover(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload-cover`, formData);
  }
}
