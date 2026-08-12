import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { Capacitor } from '@capacitor/core';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      if (Capacitor.isNativePlatform()) {
        return router.createUrlTree(['/login']);
      } else {
        return router.createUrlTree(['/']);
      }
    }

    if (authService.hasRole(allowedRoles)) {
      return true;
    }

    // Redirect to a safe fallback or a custom unauthorized page
    return router.createUrlTree(['/unauthorized']);
  };
};
