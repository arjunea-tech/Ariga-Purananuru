import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      if (allowedRoles.includes('super_admin') && !allowedRoles.includes('admin') && !allowedRoles.includes('student')) {
        return router.createUrlTree(['/superadmin/login']);
      } else if (allowedRoles.includes('admin') || allowedRoles.includes('staff')) {
        return router.createUrlTree(['/admin/login']);
      }
      return router.createUrlTree(['/login']);
    }

    if (authService.hasRole(allowedRoles)) {
      return true;
    }

    // Redirect to a safe fallback or a custom unauthorized page
    return router.createUrlTree(['/unauthorized']);
  };
};
