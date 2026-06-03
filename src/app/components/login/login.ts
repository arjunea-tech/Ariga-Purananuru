import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  loginForm!: FormGroup;
  errorMessage = '';
  successMessage = '';
  loading = false;
  activeTab: 'school' | 'admin' = 'school';
  tenantBranding: any = null;

  private tenantCode$ = new Subject<string>();
  private tenantSub?: Subscription;

  ngOnInit(): void {
    // Clear any previous active session when visiting login (deferred to avoid ExpressionChanged error)
    setTimeout(() => {
      this.authService.clearSession();
      this.resetBranding();
    });

    this.initForm();

    // Debounce the tenant code lookup to avoid flooding the API with keystrokes
    this.tenantSub = this.tenantCode$.pipe(
      debounceTime(600),
      distinctUntilChanged()
    ).subscribe(code => {
      this.fetchBranding(code);
    });
  }

  ngOnDestroy(): void {
    if (this.tenantSub) {
      this.tenantSub.unsubscribe();
    }
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      tenant_code: [
        '', 
        this.activeTab === 'school' ? [Validators.required] : []
      ],
      login: ['', [Validators.required, Validators.minLength(3)]], // Roll No / Username / Email
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  setTab(tab: 'school' | 'admin'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
    this.resetBranding();
    this.initForm();
  }

  onSchoolCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value?.trim() || '';
    this.tenantCode$.next(value);
  }

  onSchoolCodeBlur(): void {
    if (this.activeTab !== 'school') return;
    const code = this.loginForm.get('tenant_code')?.value;
    if (code) {
      this.fetchBranding(code.trim());
    }
  }

  fetchBranding(code: string): void {
    if (!code || code.length < 5) {
      this.resetBranding();
      return;
    }

    this.http.get<any>(`http://localhost:8000/api/tenants/brand/${code}`).subscribe({
      next: (brand) => {
        this.tenantBranding = brand;
        this.applyBranding(brand);
      },
      error: () => {
        this.resetBranding();
      }
    });
  }

  applyBranding(brand: any): void {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', brand.primary_color);
    root.style.setProperty('--secondary-color', brand.secondary_color);
    localStorage.setItem('tenant_branding', JSON.stringify(brand));
  }

  resetBranding(): void {
    this.tenantBranding = null;
    const root = document.documentElement;
    root.style.removeProperty('--primary-color');
    root.style.removeProperty('--secondary-color');
    localStorage.removeItem('tenant_branding');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'Login successful! Redirecting...';

        // Redirect dynamically based on the user's role
        setTimeout(() => {
          const role = response.user.role;
          if (role === 'student') {
            this.router.navigate(['/learn']); // Student workspace
          } else if (role === 'super_admin') {
            this.router.navigate(['/tenants']); // Super Admin workspace
          } else if (role === 'tenant_admin') {
            this.router.navigate(['/properties']); // Tenant Admin workspace
          } else if (role === 'property_manager') {
            this.router.navigate(['/courses']); // Property Manager / Coordinator workspace
          } else {
            this.router.navigate(['/learn']);
          }
        }, 1000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || err.error?.login?.[0] || 'Authentication failed. Please verify credentials.';
      },
    });
  }
}
