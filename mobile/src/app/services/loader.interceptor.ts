import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoaderService } from './loader.service';
import { finalize } from 'rxjs/operators';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  
  // Don't show global loader for course structure, chapters, activities, content, or brand loading to keep page transitions seamless
  const skipLoader = req.url.includes('/player-structure') || 
                     req.url.includes('/api/contents/') || 
                     req.url.includes('/api/courses') ||
                     req.url.includes('/api/chapters') ||
                     req.url.includes('/api/activities') ||
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
