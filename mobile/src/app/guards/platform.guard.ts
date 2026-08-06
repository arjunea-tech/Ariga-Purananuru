import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

export const platformGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  if (Capacitor.isNativePlatform()) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
