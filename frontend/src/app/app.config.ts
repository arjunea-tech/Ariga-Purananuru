import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { loaderInterceptor } from './services/loader.interceptor';
import { provideLottieOptions } from 'ngx-lottie';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor, loaderInterceptor])),
    provideRouter(routes),
    provideTranslateService({
      fallbackLang: 'en'
    }),
    provideTranslateHttpLoader({
      prefix: './i18n/',
      suffix: '.json'
    }),
    provideLottieOptions({
      player: () => import('lottie-web')
    })
  ]
};
