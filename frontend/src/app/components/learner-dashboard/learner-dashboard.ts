import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { CourseService } from '../../services/course';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import confetti from 'canvas-confetti';

interface Course {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

@Component({
  selector: 'app-learner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './learner-dashboard.html',
  styleUrls: ['./learner-dashboard.css']
})
export class LearnerDashboard implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private authService = inject(AuthService);
  
  courses = signal<Course[]>([]);
  isLoading = signal(true);
  isFullscreen = signal(false);
  uiTheme = signal<'adventure' | 'classic'>('adventure');

  // Mascot Tip Messages
  mascotTip = signal<string>('Welcome back, adventurer! Click "Play" on a course to start your quest!');
  showMascotSpeech = signal(true);
  showAchievementModal = signal(false);

  ngOnInit() {
    // Determine theme based on user's age from DOB
    const user = this.authService.getUser();
    if (user) {
      const age = this.getAgeFromDob(user.dob);
      if (age !== null) {
        this.uiTheme.set(age <= 15 ? 'adventure' : 'classic');
      } else {
        // No DOB set — default to classic for non-student roles, adventure for students
        const role = (user.role || '').toLowerCase();
        this.uiTheme.set(role === 'student' ? 'adventure' : 'classic');
      }
    }
    this.fetchCourses();
  }

  getAgeFromDob(dob: string | null | undefined): number | null {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }

  fetchCourses() {
    this.http.get<Course[]>(`${environment.apiUrl}/courses`).subscribe({
      next: (data) => {
        const activeCourses = data.filter(c => c.is_active);
        this.courses.set(activeCourses);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load courses', err);
        this.isLoading.set(false);
      }
    });
  }

  playCourse(course: Course, event: MouseEvent) {
    event.preventDefault(); // Prevent immediate navigation

    // Pre-fetch the structure in the background
    const url = `${environment.apiUrl}/courses/${course.id}/player-structure`;
    this.http.get<any>(url).subscribe({
      next: (structure) => {
        // Cache the structure layout in the shared CourseService
        this.courseService.cachedStructure = structure;
        this.router.navigate(['/learn', course.id]);
      },
      error: (err) => {
        console.error('Failed to pre-fetch course structure:', err);
        // Fallback: navigate immediately
        this.router.navigate(['/learn', course.id]);
      }
    });
  }

  triggerAchievement() {
    this.showAchievementModal.set(true);
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 }
    });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        this.isFullscreen.set(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          document.exitFullscreen().then(() => {
            this.isFullscreen.set(false);
          });
        });
      }
    }
  }

  logout() {
    this.authService.logout().subscribe({
      complete: () => {
        window.location.href = '/login';
      },
      error: () => {
        window.location.href = '/login';
      }
    });
  }
}
