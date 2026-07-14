import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from './services/auth';
import { NotificationService } from './services/notification.service';
import { LoaderService } from './services/loader.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { 
  IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, 
  IonContent, IonList, IonItem, IonIcon, 
  IonMenuToggle, IonButtons, IonButton, IonSplitPane, IonMenuButton, IonLabel, IonFooter
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
    CommonModule, RouterLink, TranslateModule, 
    IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, 
    IonContent, IonList, IonItem, IonIcon, 
    IonMenuToggle, IonButtons, IonButton, IonSplitPane, IonMenuButton, IonLabel, IonFooter
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

  currentLang = signal('en');
  isSidebarOpen = signal(false);
  tenantBranding = signal<any>(null);

  constructor() {
    addIcons({
      playCircleOutline, megaphoneOutline, speedometerOutline, peopleOutline, 
      trendingUpOutline, bookOutline, layersOutline, gitBranchOutline, 
      journalOutline, documentTextOutline, checkboxOutline, libraryOutline, 
      extensionPuzzleOutline, businessOutline, homeOutline, cubeOutline, 
      cloudUploadOutline, logOutOutline
    });
  }

  ngOnInit() {
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
        window.location.href = '/login';
      },
      error: () => {
        this.authService.clearSession();
        localStorage.removeItem('tenant_branding');
        const root = document.documentElement;
        root.style.removeProperty('--primary-color');
        root.style.removeProperty('--secondary-color');
        this.closeSidebar();
        window.location.href = '/login';
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
}