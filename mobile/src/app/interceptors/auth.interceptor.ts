import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const tenantCode = authService.getTenantCode();

  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  if (tenantCode) {
    headers = headers.set('X-Tenant-Code', tenantCode);
  }

  // Rewrite hardcoded dev API URLs to the correct environment baseUrl
  let url = req.url;
  if (url.startsWith('http://localhost:8000')) {
    url = url.replace('http://localhost:8000', environment.baseUrl);
  } else if (url.startsWith('http://127.0.0.1:8000')) {
    url = url.replace('http://127.0.0.1:8000', environment.baseUrl);
  }

  const clonedReq = req.clone({ headers, url });

  return next(clonedReq).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Clear session and redirect to login on 401 Unauthorized (unless user is on root Landing Page)
        authService.clearSession();
        const currentUrl = router.url || window.location.pathname;
        if (currentUrl !== '/' && currentUrl !== '' && !currentUrl.startsWith('/login')) {
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
