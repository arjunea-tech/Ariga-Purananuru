import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

declare var window: any; // For Razorpay

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './store.html',
  styleUrls: ['./store.css']
})
export class StoreComponent implements OnInit {
  courses: any[] = [];
  loading = true;
  buyingId: number | null = null;
  apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadScript('https://checkout.razorpay.com/v1/checkout.js');
    this.fetchStorefront();
  }

  fetchStorefront() {
    console.log('Fetching storefront...');
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/store/courses`).subscribe({
      next: (res) => {
        console.log('Storefront API response:', res);
        this.courses = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load store', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  buyCourse(course: any) {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      // Guest User -> Redirect to Signup
      this.router.navigate(['/signup'], { queryParams: { buy_course: course.id } });
      return;
    }

    this.buyingId = course.id;
    // Mock Payment Flow for Testing
    this.http.post<any>(`${this.apiUrl}/payment/order`, { course_id: course.id }).subscribe({
      next: (res) => {
        alert('Mock Payment Successful! Course unlocked.');
        this.buyingId = null;
        this.fetchStorefront(); // Refresh list to remove bought course
      },
      error: (err) => {
        alert('Failed to process mock payment.');
        console.error(err);
        this.buyingId = null;
      }
    });
  }

  private loadScript(url: string) {
    const isLoaded = document.querySelector(`script[src="${url}"]`);
    if (!isLoaded) {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      document.body.appendChild(script);
    }
  }
}
