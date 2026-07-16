import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CourseService } from '../../services/course';
import { AuthService } from '../../services/auth';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { gsap } from 'gsap';
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
export class LearnerDashboard implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private authService = inject(AuthService);
  courses = signal<Course[]>([]);
  isLoading = signal(true);
  isFullscreen = signal(false);
  isNavigating = signal(false);
  private navSub?: Subscription;



  // Mascot Tip Messages
  mascotTip = signal<string>('Welcome back, adventurer! Click "Play" on a course to start your quest!');
  showMascotSpeech = signal(true);

  // Mascot Lottie Configuration (Selective Mascot)
  mascotLottieOptions: AnimationOptions = {
    path: '/assets/mascot.json', // Guiding mascot
    autoplay: true,
    loop: true
  };

  // Achievement Lottie Configuration (Selective Achievement Popup)
  achievementLottieOptions: AnimationOptions = {
    path: '/assets/trophy.json', // Golden winner trophy
    autoplay: false,
    loop: false
  };
  xpPoints = signal<number>(0);
  streakDays = signal<number>(0);
  hearts = signal<number>(5);
  gems = signal<number>(0);
  badges = signal<any[]>([]);
  showAchievementModal = signal(false);

  ngOnInit() {
    this.fetchCourses();
    this.fetchStudentStats();
    // Reset overlay whenever any navigation finishes (handles component caching)
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.isNavigating.set(false));
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
  }

  fetchStudentStats() {
    const token = this.authService.getToken();
    const headers = { 'Authorization': `Bearer ${token || ''}` };
    this.http.get<any>(`${environment.apiUrl}/student/dashboard`, { headers }).subscribe({
      next: (res) => {
        this.xpPoints.set(res.xp_points || 0);
        this.streakDays.set(res.streak_days || 0);
        this.badges.set(res.badges || []);
        this.gems.set(Math.floor((res.xp_points || 0) / 15) + 5);
      },
      error: (err) => {
        console.error('Failed to load student stats', err);
      }
    });
  }

  fetchCourses() {
    this.http.get<Course[]>(`${environment.apiUrl}/courses`).subscribe({
      next: (data) => {
        this.courses.set(data.filter(c => c.is_active));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load courses', err);
        this.isLoading.set(false);
      }
    });
  }

  playCourse(course: Course, event: MouseEvent) {
    event.preventDefault();
    this.isNavigating.set(true);
    this.router.navigate(['/learn', course.id]);
  }

  triggerAchievement() {
    this.showAchievementModal.set(true);
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 }
    });
  }

  logout() {
    this.authService.logout().subscribe({
      complete: () => {
        window.location.href = '/login';
      },
      error: () => {
        this.authService.clearSession();
        window.location.href = '/login';
      }
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
          this.isFullscreen.set(false);
        });
      }
    }
  }
}
