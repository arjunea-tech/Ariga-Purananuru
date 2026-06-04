import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  loginForm!: FormGroup;
  errorMessage = '';
  successMessage = '';
  loading = false;
  tenantBranding: any = null;

  ngOnInit(): void {
    // Clear any previous active session when visiting login
    setTimeout(() => {
      this.authService.clearSession();
      this.resetBranding();
    });

    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      login: ['', [Validators.required, Validators.minLength(3)]], // Username or Email
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  fetchBranding(code: string): void {
    if (!code) return;

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

        const role = response.user.role;

        // Fetch and apply branding if tenant_code is returned
        if (response.tenant_code) {
          this.fetchBranding(response.tenant_code);
        }

        // Redirect dynamically based on the user's role
        setTimeout(() => {
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
