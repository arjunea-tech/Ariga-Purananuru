import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
const isNativePlatform = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const path = state.url.split('?')[0];

  // Block student login/signup on web platform and redirect to landing page
  if (!isNativePlatform() && (path === '/login' || path === '/signup')) {
    authService.clearSession();
    return router.createUrlTree(['/']);
  }

  // If explicitly navigating to a login page, clear active session to allow switching roles
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

