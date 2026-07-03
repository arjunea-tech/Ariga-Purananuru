import { environment } from '../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface UserData {
  id: number;
  name: string;
  username?: string;
  email?: string;
  role: string;
  tenant_id?: number;
  dob?: string | null;
}

export interface AuthResponse {
  user: UserData;
  access_token: string;
  token_type: string;
  tenant_code?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  login(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap({
        complete: () => this.clearSession(),
        error: () => this.clearSession(),
      })
    );
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem('auth_token', res.access_token);
    if (res.tenant_code) {
      localStorage.setItem('tenant_code', res.tenant_code);
    } else {
      localStorage.removeItem('tenant_code');
    }
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  public clearSession(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_code');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getTenantCode(): string | null {
    return localStorage.getItem('tenant_code');
  }

  getUser(): UserData | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getUserRole(): string | null {
    const user = this.getUser();
    return user ? user.role : null;
  }

  hasRole(allowedRoles: string[]): boolean {
    const role = this.getUserRole();
    return role ? allowedRoles.includes(role) : false;
  }

  updateProfile(data: { name: string; email: string }): Observable<any> {
    const token = this.getToken();
    const headers = { 'Authorization': `Bearer ${token || ''}` };
    return this.http.put<any>(`${this.apiUrl}/profile`, data, { headers }).pipe(
      tap((res) => {
        if (res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }
}
