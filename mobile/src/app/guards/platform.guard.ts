import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const platformGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    return router.createUrlTree(['/tabs/home']);
  }

  // Allow guests to see the onboarding / WelcomeScreen on both web and native app
  return true;
};
