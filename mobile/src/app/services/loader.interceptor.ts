import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoaderService } from './loader.service';
import { finalize } from 'rxjs/operators';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  
  // Skip global loader for background/silent API calls to keep page transitions seamless
  const skipLoader = req.url.includes('/player-structure') || 
                     req.url.includes('/api/contents/') ||
                     req.url.includes('/api/courses') ||
                     req.url.includes('/api/chapters') ||
                     req.url.includes('/api/activities') ||
                     req.url.includes('/student/dashboard') ||
                     req.url.includes('/progress-stats') ||
                     req.url.includes('/api/users') ||
                     req.url.includes('/api/logout') ||
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
