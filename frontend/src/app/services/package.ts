import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CourseData } from './course';

export interface PackageData {
  id?: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  courses?: CourseData[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PackageService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/packages';

  getAll(): Observable<PackageData[]> {
    return this.http.get<PackageData[]>(this.apiUrl);
  }

  create(data: PackageData): Observable<PackageData> {
    return this.http.post<PackageData>(this.apiUrl, data);
  }

  update(id: number, data: PackageData): Observable<PackageData> {
    return this.http.put<PackageData>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
