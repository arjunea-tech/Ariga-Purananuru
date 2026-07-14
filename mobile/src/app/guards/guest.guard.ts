import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

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
