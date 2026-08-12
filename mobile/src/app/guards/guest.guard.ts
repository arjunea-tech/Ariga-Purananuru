import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If explicitly navigating to a login page, clear active session to allow switching roles
  const path = state.url.split('?')[0];
  if (path === '/login' || path === '/admin/login' || path === '/superadmin/login') {
    authService.clearSession();
    return true;
  }

  if (authService.isLoggedIn()) {
    const role = authService.getUserRole();
    if (role === 'student') {
      return router.createUrlTree(['/learn']);
    } else {
      return router.createUrlTree(['/admin-dashboard']);
    }
  }

  return true;
};

