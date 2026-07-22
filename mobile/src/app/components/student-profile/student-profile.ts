import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-profile.html',
  styleUrls: ['./student-profile.css']
})
export class StudentProfileComponent implements OnInit {
  protected authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  userName = signal<string>('Student');
  userEmail = signal<string>('');
  xpPoints = signal<number>(0);
  title = signal<string>('Yaappu Student');

  achievements = signal([
    { name: '15 Day Streak', icon: '🔥', bg: '#FF7675' },
    { name: 'Asai Master', icon: '⭐', bg: '#6C5CE7' },
    { name: 'First Module', icon: '🏅', bg: '#00B894' },
    { name: '1000 XP Club', icon: '💎', bg: '#0984E3' }
  ]);

  menuItems = [
    { id: 'personal_info', title: 'Personal Info', icon: 'bi-person-badge' },
    { id: 'certificates', title: 'Certificates', icon: 'bi-award' },
    { id: 'stats', title: 'My Stats', icon: 'bi-graph-up' },
    { id: 'help', title: 'Help & Support', icon: 'bi-question-circle' }
  ];

  activeModal = signal<'none' | 'personal_info' | 'certificates' | 'stats' | 'help'>('none');

  studentPhone = signal<string>('+91 98765 43210');
  studentSchool = signal<string>('Yaappu Academy');
  completionPercentage = signal<number>(0);
  accuracyPercentage = signal<number>(0);
  streakDays = signal<number>(0);
  questionsAnswered = signal<number>(0);
  skillMastery = signal<any[]>([]);

  ngOnInit(): void {
    this.loadUserProfile();
    this.fetchProfileStats();
  }

  loadUserProfile(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName.set(user.name || 'VaniViji');
      this.userEmail.set(user.email || '');
    }
    const userId = user?.id || 1;
    const storedXp = localStorage.getItem(`lang_app_xp_${userId}`);
    if (storedXp) {
      this.xpPoints.set(+storedXp);
    } else {
      this.xpPoints.set(1850);
    }
  }

  fetchProfileStats(): void {
    const userId = this.authService.getUser()?.id || 1;
    this.http.get<any>(`${environment.apiUrl}/student/dashboard`).subscribe({
      next: (res) => {
        if (res) {
          if (typeof res.xp_points === 'number') this.xpPoints.set(res.xp_points);
          if (typeof res.completion_percentage === 'number') this.completionPercentage.set(res.completion_percentage);
          if (typeof res.accuracy_percentage === 'number' || typeof res.average_score === 'number') {
            this.accuracyPercentage.set(res.accuracy_percentage || res.average_score);
          }
          if (typeof res.streak_days === 'number') this.streakDays.set(res.streak_days);
          if (typeof res.passed_attempts === 'number') this.questionsAnswered.set(res.passed_attempts * 15 + 40);

          if (res.skill_mastery && Array.isArray(res.skill_mastery)) {
            this.skillMastery.set(res.skill_mastery);
          } else {
            // Mock skill mastery for presentation if not present
            this.skillMastery.set([
              { topic: 'எழுத்து', mastery: 85, color: '#22c55e' },
              { topic: 'அசை', mastery: 65, color: '#00B894' },
              { topic: 'சீர்', mastery: 40, color: '#3b82f6' }
            ]);
          }

          if (res.badges && res.badges.length > 0) {
            const mappedBadges = res.badges.map((b: any) => ({
              name: b.title,
              icon: b.icon || '⭐',
              bg: b.unlocked ? '#00B894' : '#B2BEC3'
            }));
            this.achievements.set(mappedBadges);
          } else {
            // Generate dynamic achievements based on progress
            const newAchievements = [];
            if (this.streakDays() >= 3) {
              newAchievements.push({ name: `${this.streakDays()} Day Streak`, icon: '🔥', bg: '#FF7675' });
            }
            if (this.completionPercentage() > 0) {
              newAchievements.push({ name: 'First Step', icon: '🚀', bg: '#0984E3' });
            }
            if (this.completionPercentage() >= 50) {
              newAchievements.push({ name: 'Halfway There', icon: '🎯', bg: '#6C5CE7' });
            }
            if (this.accuracyPercentage() >= 80) {
              newAchievements.push({ name: 'Accuracy Master', icon: '💎', bg: '#00B894' });
            }
            if (newAchievements.length === 0) {
              newAchievements.push({ name: 'Welcome', icon: '👋', bg: '#B2BEC3' });
            }
            this.achievements.set(newAchievements);
          }
        }
      },
      error: () => {
        // Fallback
        this.achievements.set([{ name: 'Welcome', icon: '👋', bg: '#B2BEC3' }]);
        this.skillMastery.set([
          { topic: 'எழுத்து', mastery: 85, color: '#22c55e' },
          { topic: 'அசை', mastery: 65, color: '#00B894' }
        ]);
      }
    });
  }

  onMenuClick(item: any) {
    if (item.id) {
      this.activeModal.set(item.id);
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  closeModal() {
    this.activeModal.set('none');
  }

  logout() {
    this.authService.clearSession();
    this.authService.logout().subscribe({ error: () => {} });
    this.router.navigate(['/login']);
  }
}
