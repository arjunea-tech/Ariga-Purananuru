import { Component, signal, inject, OnInit } from '@angular/core';

import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from './services/auth';
import { NotificationService } from './services/notification.service';
import { LoaderService } from './services/loader.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { 
  IonApp, IonRouterOutlet
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  playCircleOutline, megaphoneOutline, speedometerOutline, peopleOutline, 
  trendingUpOutline, bookOutline, layersOutline, gitBranchOutline, 
  journalOutline, documentTextOutline, checkboxOutline, libraryOutline, 
  extensionPuzzleOutline, businessOutline, homeOutline, cubeOutline, 
  cloudUploadOutline, logOutOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    IonApp,
    IonRouterOutlet
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Language Management System');

  private translate = inject(TranslateService);
  protected authService = inject(AuthService);
  protected notificationService = inject(NotificationService);
  public loaderService = inject(LoaderService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private location = inject(Location);

  currentLang = signal('en');
  isSidebarOpen = signal(false);
  tenantBranding = signal<any>(null);

  isPublicRoute(): boolean {
    const url = this.router.url.split('?')[0];
    const publicPaths = [
      '/',
      '/login',
      '/signup',
      '/public-store',
      '/download-app',
      '/unauthorized',
      '/admin/login',
      '/superadmin/login'
    ];
    return publicPaths.includes(url) || url.startsWith('/public-course-details/');
  }

  constructor() {
    addIcons({
      playCircleOutline, megaphoneOutline, speedometerOutline, peopleOutline, 
      trendingUpOutline, bookOutline, layersOutline, gitBranchOutline, 
      journalOutline, documentTextOutline, checkboxOutline, libraryOutline, 
      extensionPuzzleOutline, businessOutline, homeOutline, cubeOutline, 
      cloudUploadOutline, logOutOutline
    });
  }

  showExitModal = signal<boolean>(false);

  ngOnInit() {
    // Scroll to top on every router navigation
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        const scrollables = document.querySelectorAll('.games-hub-page, .container-fluid, ion-content, .card');
        scrollables.forEach(el => { el.scrollTop = 0; });
      }, 50);
    });

    // Only configure native plugins on physical/emulated mobile platforms
    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
        StatusBar.setStyle({ style: Style.Light }).catch(() => {});
        StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
      } catch (e) {
        console.warn('StatusBar plugin error:', e);
      }

      try {
        CapApp.addListener('backButton', () => {
          this.handleBackAction();
        });
      } catch (e) {
        console.warn('CapApp backButton listener not active:', e);
      }
    }

    const savedLang = localStorage.getItem('userLang') || 'en';
    this.translate.setDefaultLang('en');
    this.translate.use(savedLang);
    this.currentLang.set(savedLang);

    // Fetch and apply branding based on user's active tenant
    const user = this.authService.getUser();
    const tenantCode = this.authService.getTenantCode();
    if (user && user.tenant_id && tenantCode) {
      this.http.get<any>(`${environment.apiUrl}/tenants/brand/${tenantCode}`).subscribe({
        next: (brand) => {
          this.tenantBranding.set(brand);
          const root = document.documentElement;
          if (brand.primary_color) {
            root.style.setProperty('--primary-color', brand.primary_color);
          }
          if (brand.secondary_color) {
            root.style.setProperty('--secondary-color', brand.secondary_color);
          }
          localStorage.setItem('tenant_branding', JSON.stringify(brand));
        },
        error: () => {
          // Fallback to local storage if API call fails
          const savedBranding = localStorage.getItem('tenant_branding');
          if (savedBranding) {
            try {
              const brand = JSON.parse(savedBranding);
              this.tenantBranding.set(brand);
              const root = document.documentElement;
              if (brand.primary_color) {
                root.style.setProperty('--primary-color', brand.primary_color);
              }
              if (brand.secondary_color) {
                root.style.setProperty('--secondary-color', brand.secondary_color);
              }
            } catch (e) {
              console.error('Failed to parse saved branding', e);
            }
          }
        }
      });
    } else {
      // Clear branding if no tenant (e.g. super admin)
      this.tenantBranding.set(null);
      localStorage.removeItem('tenant_branding');
      const root = document.documentElement;
      root.style.removeProperty('--primary-color');
      root.style.removeProperty('--secondary-color');
    }
  }

  logout() {
    this.authService.logout().subscribe({
      complete: () => {
        localStorage.removeItem('tenant_branding');
        const root = document.documentElement;
        root.style.removeProperty('--primary-color');
        root.style.removeProperty('--secondary-color');
        this.closeSidebar();
        window.location.href = '/';
      },
      error: () => {
        this.authService.clearSession();
        localStorage.removeItem('tenant_branding');
        const root = document.documentElement;
        root.style.removeProperty('--primary-color');
        root.style.removeProperty('--secondary-color');
        this.closeSidebar();
        window.location.href = '/';
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  switchLanguage(event: Event) {
    const lang = (event.target as HTMLSelectElement).value;
    this.translate.use(lang);
    localStorage.setItem('userLang', lang);
    this.currentLang.set(lang);
  }

  handleBackAction() {
    const rawUrl = this.router.url;
    const path = rawUrl.split('?')[0];

    // If modal is open, close modal
    if (this.showExitModal()) {
      this.showExitModal.set(false);
      return;
    }

    // 1. If on Home tab or Login -> Open Exit Modal
    if (path === '/tabs/home' || path === '/login' || path === '/') {
      this.showExitModal.set(true);
      return;
    }

    // 2. If at root of any non-home tab (Learn, Games/Practice, Progress, Profile) -> Navigate to Home Tab
    const rootTabs = ['/tabs/learn', '/tabs/games', '/tabs/progress', '/tabs/profile'];
    if (rootTabs.includes(path)) {
      if (path === '/tabs/learn' && (rawUrl.includes('view=category-details') || rawUrl.includes('view=modules'))) {
        this.location.back();
      } else if (path === '/tabs/profile' && rawUrl.includes('modal=')) {
        this.location.back();
      } else if (path === '/tabs/games' && rawUrl.includes('view=')) {
        this.location.back();
      } else {
        this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
      }
      return;
    }

    // 3. Sub-pages (e.g. inside course player) -> Go back in history
    this.location.back();
  }

  confirmExitApp() {
    this.showExitModal.set(false);
    if (Capacitor.isNativePlatform()) {
      CapApp.exitApp();
    } else {
      window.close();
    }
  }

  cancelExitApp() {
    this.showExitModal.set(false);
  }
}