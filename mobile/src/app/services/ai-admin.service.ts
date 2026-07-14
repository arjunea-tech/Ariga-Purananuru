import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiAdminService {
  // Python FastAPI backend URL
  private baseUrl = 'https://sangam-ai.onrender.com/api';

  constructor(private http: HttpClient) { }

  uploadDataset(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/poems/upload`, data);
  }

  uploadQaDataset(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/qa/upload`, data);
  }
}
