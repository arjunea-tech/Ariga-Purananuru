import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

export const platformGuard: CanActivateFn = (route, state) => {
  return true;
};
