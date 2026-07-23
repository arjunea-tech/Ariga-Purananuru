import { environment } from '../../../environments/environment';
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';

interface TenantStats {
  total_students: number;
  total_staff: number;
  active_courses: number;
  overall_completion_rate: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  protected authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  stats = signal<TenantStats | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  dashboardTenantId = signal<string>('all');

  // Branding Signals & Properties
  brandingForm!: FormGroup;
  savingBranding = signal<boolean>(false);
  logoFile: File | null = null;
  logoPreviewUrl = signal<string | null>(null);
  tenant = signal<any>(null);
  tenantsList = signal<any[]>([]);

  ngOnInit(): void {
    this.loadStats();
    this.initBrandingForm();
    if (this.authService.hasRole(['super_admin', 'admin'])) {
      this.loadTenantBranding();
    }
  }

  initBrandingForm(): void {
    this.brandingForm = this.fb.group({
      primary_color: ['#7c3aed', [Validators.required, Validators.maxLength(10)]],
      secondary_color: ['#db2777', [Validators.required, Validators.maxLength(10)]],
    });
  }

  loadTenantBranding(): void {
    this.http.get<any[]>(`${environment.apiUrl}/tenants`).subscribe({
      next: (tenants) => {
        this.tenantsList.set(tenants || []);
        if (tenants && tenants.length > 0) {
          const user = this.authService.getUser();
          const activeTenant = tenants.find(t => t.id === user?.tenant_id) || tenants[0];
          this.selectTenant(activeTenant);
        }
      },
      error: (err) => {
        console.error('Failed to load tenant details', err);
      }
    });
  }

  selectTenant(tenant: any): void {
    this.tenant.set(tenant);
    this.brandingForm.patchValue({
      primary_color: tenant.primary_color || '#7c3aed',
      secondary_color: tenant.secondary_color || '#db2777',
    });
    if (tenant.logo_path) {
      this.logoPreviewUrl.set(tenant.logo_path);
    } else {
      this.logoPreviewUrl.set(null);
    }
    this.logoFile = null;
  }

  onTenantChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const tenantId = Number(select.value);
    const selected = this.tenantsList().find(t => t.id === tenantId);
    if (selected) {
      this.selectTenant(selected);
    }
  }

  onDashboardTenantChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.dashboardTenantId.set(select.value);
    this.loadStats();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.logoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreviewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(this.logoFile);
    }
  }

  saveBranding(): void {
    if (this.brandingForm.invalid || !this.tenant()) {
      return;
    }

    this.savingBranding.set(true);
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('primary_color', this.brandingForm.get('primary_color')?.value);
    formData.append('secondary_color', this.brandingForm.get('secondary_color')?.value);
    if (this.logoFile) {
      formData.append('logo', this.logoFile);
    }

    const tenantId = this.tenant().id;
    this.http.post<any>(`${environment.apiUrl}/tenants/${tenantId}/branding`, formData).subscribe({
      next: (updatedTenant) => {
        this.savingBranding.set(false);
        this.notificationService.show('success', 'Branding settings updated successfully!');
        
        const user = this.authService.getUser();
        if (user && user.tenant_id === updatedTenant.id) {
          // Immediately apply new colors to root element
          const root = document.documentElement;
          if (updatedTenant.primary_color) {
            root.style.setProperty('--primary-color', updatedTenant.primary_color);
          }
          if (updatedTenant.secondary_color) {
            root.style.setProperty('--secondary-color', updatedTenant.secondary_color);
          }
          
          // Update stored branding in localStorage
          const localBranding = {
            tenant_name: updatedTenant.tenant_name,
            logo_url: updatedTenant.logo_path,
            primary_color: updatedTenant.primary_color,
            secondary_color: updatedTenant.secondary_color,
          };
          localStorage.setItem('tenant_branding', JSON.stringify(localBranding));

          // Trigger a reload after toast display to refresh sidebar logo and text
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          // If super admin edited another tenant, just reload the list of tenants to update UI
          this.loadTenantBranding();
        }
      },
      error: (err) => {
        this.savingBranding.set(false);
        this.notificationService.show('error', 'Failed to update branding settings.');
      }
    });
  }

  loadStats(): void {
    this.loading.set(true);
    this.error.set(null);

    const url = `${environment.apiUrl}/dashboard/tenant-stats?tenant_id=${this.dashboardTenantId()}`;
    this.http.get<TenantStats>(url).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load dashboard statistics.');
        this.loading.set(false);
      }
    });
  }
}
