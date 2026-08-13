import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
const isNativePlatform = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      if (isNativePlatform()) {
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
