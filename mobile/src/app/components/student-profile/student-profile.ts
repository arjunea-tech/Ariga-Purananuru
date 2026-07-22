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
    { title: 'Certificates', icon: 'bi-award', route: '/tabs/progress' },
    { title: 'My Stats', icon: 'bi-graph-up', route: '/tabs/progress' },
    { title: 'Settings', icon: 'bi-gear', route: '/tabs/profile' },
    { title: 'Help & Support', icon: 'bi-question-circle', route: '/tabs/profile' }
  ];

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
          if (res.xp_points) {
            this.xpPoints.set(res.xp_points);
          }
          if (res.badges && res.badges.length > 0) {
            const mappedBadges = res.badges.map((b: any) => ({
              name: b.title,
              icon: b.icon || '⭐',
              bg: b.unlocked ? '#00B894' : '#B2BEC3'
            }));
            this.achievements.set(mappedBadges);
          }
        }
      },
      error: () => {
        // Fallback dynamic badges based on storage
        const legacyChaptersRaw = localStorage.getItem('completed_chapters');
        const completed: number[] = legacyChaptersRaw ? JSON.parse(legacyChaptersRaw) : [1];
        if (completed.length >= 2) {
          this.achievements.set([
            { name: 'First Step', icon: '🚀', bg: '#FF7675' },
            { name: 'Asai Master', icon: '⭐', bg: '#6C5CE7' },
            { name: 'Scholar', icon: '🎓', bg: '#00B894' },
            { name: 'Chapter Champion', icon: '🏆', bg: '#0984E3' }
          ]);
        }
      }
    });
  }

  onMenuClick(item: any) {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  logout() {
    // Clear session immediately so guards redirect correctly
    this.authService.clearSession();
    // Also attempt API logout (fire and forget)
    this.authService.logout().subscribe({ error: () => {} });
    this.router.navigate(['/login']);
  }
}
