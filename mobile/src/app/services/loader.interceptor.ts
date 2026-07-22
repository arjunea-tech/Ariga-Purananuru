import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoaderService } from './loader.service';
import { finalize } from 'rxjs/operators';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  
  // Skip global loader for background/silent API calls to keep page transitions seamless
  const skipLoader = req.url.includes('/player-structure') || 
                     req.url.includes('/contents/') ||
                     req.url.includes('/courses') ||
                     req.url.includes('/chapters') ||
                     req.url.includes('/activities') ||
                     req.url.includes('/student/dashboard') ||
                     req.url.includes('/progress-stats') ||
                     req.url.includes('/users') ||
                     req.url.includes('/logout') ||
                     req.url.includes('/tenants/brand/');
  
  if (!skipLoader) {
    loaderService.show();
  }
  
  return next(req).pipe(
    finalize(() => {
      if (!skipLoader) {
        loaderService.hide();
      }
    })
  );
};
