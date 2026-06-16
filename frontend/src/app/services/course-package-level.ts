import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CoursePackageLevelData {
  id?: number;
  package_id: number;
  level_id: number;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CoursePackageLevelService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/packages';

  getByPackage(packageId: number, courseId?: number): Observable<any[]> {
    let url = `${this.apiUrl}/${packageId}/levels`;
    if (courseId) {
      url += `?course_id=${courseId}`;
    }
    return this.http.get<any[]>(url);
  }

  mapLevels(packageId: number, courseId: number, levelIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${packageId}/levels`, {
      course_id: courseId,
      level_ids: levelIds
    });
  }

  unmap(packageId: number, levelId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${packageId}/levels/${levelId}`);
  }
}
