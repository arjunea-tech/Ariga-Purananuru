import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  // User identity — from auth service (real login data)
  userName = signal<string>('');
  userEmail = signal<string>('');
  userRole = signal<string>('மாணவர்');
  studentOrg = signal<string>('');

  // Stats — from backend API only (no fake values)
  xpPoints = signal<number>(0);
  completionPercentage = signal<number>(0);
  accuracyPercentage = signal<number>(0);
  streakDays = signal<number>(0);
  questionsAnswered = signal<number>(0);
  correctAnswers = signal<number>(0);
  wrongAnswers = signal<number>(0);

  // Badges — only earned (unlocked) from backend
  earnedBadges = signal<{ name: string; icon: string; bg: string }[]>([]);

  // Skill mastery — from backend module_progressions
  skillMastery = signal<{ topic: string; mastery: number; color: string }[]>([]);

  // Certificates from backend
  certificates = signal<any[]>([]);

  // Loading state
  isLoading = signal<boolean>(true);

  menuItems = [
    { id: 'personal_info', title: 'Personal Info', icon: 'bi-person-badge' },
    { id: 'certificates', title: 'Certificates', icon: 'bi-award' },
    { id: 'stats', title: 'My Stats', icon: 'bi-graph-up' },
    { id: 'help', title: 'Help & Support', icon: 'bi-question-circle' }
  ];

  activeModal = signal<'none' | 'personal_info' | 'certificates' | 'stats' | 'help'>('none');

  ngOnInit(): void {
    this.loadUserFromAuth();
    this.fetchProfileStats();
  }

  loadUserFromAuth(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName.set(user.name || '');
      this.userEmail.set(user.email || '');
      this.userRole.set(user.role === 'student' ? 'மாணவர்' : (user.role || 'பயனர்'));
      this.studentOrg.set((user as any).tenant?.tenant_name || '');
    }
  }

  fetchProfileStats(): void {
    this.isLoading.set(true);
    const token = this.authService.getToken();
    if (!token) {
      this.isLoading.set(false);
      return;
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any>(`${environment.apiUrl}/student/dashboard`, { headers }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (!res) return;

        // XP Points — real from DB
        if (typeof res.xp_points === 'number') this.xpPoints.set(res.xp_points);

        // Completion
        if (typeof res.completion_percentage === 'number') this.completionPercentage.set(res.completion_percentage);

        // Accuracy
        const acc = res.accuracy_percentage ?? res.average_score ?? 0;
        this.accuracyPercentage.set(typeof acc === 'number' ? Math.round(acc) : 0);

        // Streak
        if (typeof res.streak_days === 'number') this.streakDays.set(res.streak_days);

        // Questions — real values from backend
        if (typeof res.questions_answered === 'number') this.questionsAnswered.set(res.questions_answered);
        if (typeof res.correct_answers === 'number') this.correctAnswers.set(res.correct_answers);
        if (typeof res.wrong_answers === 'number') this.wrongAnswers.set(res.wrong_answers);

        // Badges — only show earned (unlocked) badges
        if (res.badges && Array.isArray(res.badges)) {
          const badgeColors: Record<string, string> = {
            first_step: '#6366f1',
            bookworm: '#10b981',
            scholar: '#3b82f6',
            perfectionist: '#f59e0b',
            chapter_champ: '#ec4899',
            graduation: '#8b5cf6'
          };
          const earned = res.badges
            .filter((b: any) => b.unlocked)
            .map((b: any) => ({
              name: b.title,
              icon: b.icon || '⭐',
              bg: badgeColors[b.id] || '#64748b'
            }));
          this.earnedBadges.set(earned);
        }

        // Skill Mastery — from real module_progressions
        if (res.skill_mastery && Array.isArray(res.skill_mastery) && res.skill_mastery.length > 0) {
          this.skillMastery.set(res.skill_mastery.map((s: any) => ({
            topic: s.topic || s.name,
            mastery: typeof s.mastery === 'number' ? s.mastery : 0,
            color: s.color || '#3b82f6'
          })));
        } else if (res.module_progressions && Array.isArray(res.module_progressions)) {
          const colors = ['#22c55e', '#00B894', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
          this.skillMastery.set(
            res.module_progressions.map((m: any, idx: number) => ({
              topic: m.name,
              mastery: typeof m.percentage === 'number' ? m.percentage : 0,
              color: m.color || colors[idx % colors.length]
            }))
          );
        }

        // Certificates from backend
        if (res.certificates && Array.isArray(res.certificates)) {
          this.certificates.set(res.certificates);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onMenuClick(item: any) {
    if (item.id) this.activeModal.set(item.id);
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
