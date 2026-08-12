import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      return router.createUrlTree(['/']);
    }

    if (authService.hasRole(allowedRoles)) {
      return true;
    }

    // Redirect to a safe fallback or a custom unauthorized page
    return router.createUrlTree(['/unauthorized']);
  };
};
