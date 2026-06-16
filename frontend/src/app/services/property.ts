import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantData } from './tenant';

export interface PropertyPackageData {
  id: number;
  name?: string;
  code?: string;
  pivot?: {
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
  };
}

export interface PropertyData {
  id?: number;
  tenant_id: number;
  property_code: string;
  property_name: string;
  location?: string;
  address?: string;
  max_users: number;
  is_active: boolean;
  tenant?: TenantData;
  packages?: PropertyPackageData[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/properties';

  getAll(): Observable<PropertyData[]> {
    return this.http.get<PropertyData[]>(this.apiUrl);
  }

  getById(id: number): Observable<PropertyData> {
    return this.http.get<PropertyData>(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<PropertyData> {
    return this.http.post<PropertyData>(this.apiUrl, data);
  }

  update(id: number, data: any): Observable<PropertyData> {
    return this.http.put<PropertyData>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
