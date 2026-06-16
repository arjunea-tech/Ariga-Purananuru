import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

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

  const clonedReq = req.clone({ headers });

  return next(clonedReq).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Clear session and redirect to login on 401 Unauthorized
        authService.clearSession();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
