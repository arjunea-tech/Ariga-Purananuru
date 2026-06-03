import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
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
  return next(clonedReq);
};
