import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-details.html',
  styleUrls: ['./course-details.css']
})
export class CourseDetails implements OnInit {
  courseId: number | null = null;
  course: any = null;
  syllabus: any = null;
  loading = true;
  loadingSyllabus = false;
  buying = false;
  apiUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.courseId) {
      this.fetchCourseData();
    }
  }

  fetchCourseData() {
    // 1. Fetch course details
    // We can fetch from public store and filter, or just hit a specific endpoint.
    // The public /store/courses returns all courses, so we'll just filter for now to avoid creating a new endpoint.
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/store/courses`).subscribe({
      next: (courses) => {
        this.course = courses.find(c => c.id === this.courseId);
        this.loading = false;
        
        if (this.course) {
          this.fetchSyllabus();
        }
      },
      error: (err) => {
        console.error('Failed to load course details', err);
        this.loading = false;
      }
    });
  }

  fetchSyllabus() {
    this.loadingSyllabus = true;
    this.http.get(`${this.apiUrl}/courses/${this.courseId}/player-structure`).subscribe({
      next: (res: any) => {
        this.syllabus = res;
        this.loadingSyllabus = false;
      },
      error: (err) => {
        console.error('Failed to load syllabus', err);
        this.loadingSyllabus = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  buyCourse() {
    if (!this.course) return;

    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      // Guest User -> Redirect to Signup
      this.router.navigate(['/signup'], { queryParams: { buy_course: this.course.id } });
      return;
    }

    // Logged in user -> create order
    this.buying = true;
    this.http.post<any>(`${this.apiUrl}/payment/order`, { course_id: this.course.id }).subscribe({
      next: (res) => {
        alert('Mock Payment Successful! Course unlocked.');
        this.buying = false;
        // Redirect to learning dashboard or my courses
        this.router.navigate(['/tabs/learn']);
      },
      error: (err) => {
        alert('Failed to process payment. Please try logging in again.');
        console.error(err);
        this.buying = false;
      }
    });
  }
}
