import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'],
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/tabs/home']);
    }
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      login: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('password_confirmation')?.value
      ? null : { mismatch: true };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      ...this.signupForm.value,
      role: 'student'
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.successMessage = 'Registration successful!';
        
        const buyCourseId = this.route.snapshot.queryParamMap.get('buy_course');
        if (buyCourseId) {
          this.successMessage = 'Registration successful! Securing your course...';
          this.http.post<any>(`${environment.apiUrl}/payment/order`, { course_id: buyCourseId }).subscribe({
            next: (orderRes) => {
              this.loading = false;
              alert('Course unlocked successfully!');
              if (Capacitor.isNativePlatform()) {
                this.router.navigate(['/tabs/home']);
              } else {
                this.router.navigate(['/download-app']);
              }
            },
            error: (err) => {
              this.loading = false;
              console.error(err);
              alert('Failed to process payment, but account was created.');
              if (Capacitor.isNativePlatform()) {
                this.router.navigate(['/tabs/home']);
              } else {
                this.router.navigate(['/download-app']);
              }
            }
          });
        } else {
          this.loading = false;
          setTimeout(() => {
            if (Capacitor.isNativePlatform()) {
              this.router.navigate(['/tabs/home']);
            } else {
              this.router.navigate(['/download-app']);
            }
          }, 1000);
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.error && err.error.errors) {
          const firstError = Object.values(err.error.errors)[0] as string[];
          this.errorMessage = firstError[0];
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'An error occurred during registration.';
        }
      },
    });
  }
}
