import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import confetti from 'canvas-confetti';

export interface BadgeDetail {
  name: string;
  description: string;
  icon: string;
  bg: string;
  xp: number;
}

export interface EnrolledCourse {
  id: string;
  name: string;
  completion: number;           // 0–100
  accuracy: number;
  questionsAnswered: number;
  correctAnswers: number;
  wrongAnswers: number;
  streakDays: number;
  xpPoints: number;
  certDate: string;
  certId: string;
  skillMastery: { topic: string; mastery: number; color: string }[];
}

export interface SupportTicket {
  id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  admin_reply?: string;
  replied_at?: string;
  created_at: string;
}

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  userAvatar = signal<string>('assets/images/mascot.png');

  // Editable Profile signals
  isEditingProfile = signal<boolean>(false);
  editName = signal<string>('');
  editEmail = signal<string>('');
  editAvatar = signal<string>('assets/images/mascot.png');
  isSavingProfile = signal<boolean>(false);
  profileSuccessMsg = signal<string>('');
  profileErrorMsg = signal<string>('');

  // Preset Student Avatars
  presetAvatars = [
    { id: 'mascot', name: '🦉 Owl Mascot', url: 'assets/images/mascot.png' },
    { id: 'boy', name: '👦 Student Boy', url: 'assets/images/welcome_hero.png' },
    { id: 'girl', name: '👧 Student Girl', url: 'assets/images/login_hero.png' },
    { id: 'scholar', name: '🎓 Scholar Logo', url: 'assets/images/logo.png' }
  ];

  // Stats — from backend API only (no fake values)
  xpPoints = signal<number>(0);
  completionPercentage = signal<number>(0);
  accuracyPercentage = signal<number>(0);
  streakDays = signal<number>(0);
  questionsAnswered = signal<number>(0);
  correctAnswers = signal<number>(0);
  wrongAnswers = signal<number>(0);

  // Badges — only earned (unlocked) from backend
  earnedBadges = signal<BadgeDetail[]>([]);
  selectedBadge = signal<BadgeDetail | null>(null);
  showBadgeModal = signal<boolean>(false);

  // Skill mastery — from backend module_progressions
  skillMastery = signal<{ topic: string; mastery: number; color: string }[]>([]);

  // ── Multi-course support ────────────────────────────────────────────
  enrolledCourses = signal<EnrolledCourse[]>([]);
  /** Selected course ID for Certificates tab */
  selectedCertCourseId = signal<string>('');
  /** Selected course ID for Statistics tab */
  selectedStatsCourseId = signal<string>('');

  // Certificates from backend & Preview mode
  certificates = signal<any[]>([]);
  showCertPreview = signal<boolean>(false);
  courseName = signal<string>('புறநானூறு - யாப்பு இலக்கணம்');
  certDate = new Date().toLocaleDateString('ta-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  certId = Math.floor(100000 + Math.random() * 900000).toString();

  // Loading state
  isLoading = signal<boolean>(true);

  // ── Support Tickets ──────────────────────────────────────────────────
  supportTickets = signal<SupportTicket[]>([]);
  ticketSubject = signal<string>('');
  ticketCategory = signal<string>('general');
  ticketPriority = signal<string>('normal');
  ticketMessage = signal<string>('');
  isSubmittingTicket = signal<boolean>(false);
  ticketSuccessMsg = signal<string>('');
  ticketErrorMsg = signal<string>('');
  isViewingTickets = signal<boolean>(false);

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
    this.fetchMyTickets();
  }

  goBackToHome(): void {
    this.router.navigate(['/tabs/home']);
  }

  loadUserFromAuth(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName.set(user.name || '');
      this.userEmail.set(user.email || '');
      this.userRole.set(user.role === 'student' ? 'மாணவர்' : (user.role || 'பயனர்'));
      this.studentOrg.set((user as any).tenant?.tenant_name || '');
      if (user.avatar) {
        this.userAvatar.set(user.avatar);
      } else {
        this.userAvatar.set('assets/images/mascot.png');
      }
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
          const earned: BadgeDetail[] = res.badges
            .filter((b: any) => b.unlocked)
            .map((b: any) => ({
              name: b.title,
              description: b.description || 'Achievement unlocked for mastering course concepts!',
              icon: b.icon || '⭐',
              bg: badgeColors[b.id] || '#64748b',
              xp: b.xp || 100
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

        // ── Build enrolledCourses array ──────────────────────────────
        // If backend returns an array of courses, map each one.
        // Fallback: wrap the single-course stats the backend already returns.
        const colors = ['#22c55e', '#00B894', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

        if (res.enrolled_courses && Array.isArray(res.enrolled_courses) && res.enrolled_courses.length > 0) {
          // ✅ Future multi-course backend shape
          const courses: EnrolledCourse[] = res.enrolled_courses.map((c: any, idx: number) => ({
            id: String(c.id || idx),
            name: c.course_name || c.name || `Course ${idx + 1}`,
            completion: typeof c.completion_percentage === 'number' ? c.completion_percentage : 0,
            accuracy: typeof c.accuracy_percentage === 'number' ? Math.round(c.accuracy_percentage) : 0,
            questionsAnswered: c.questions_answered || 0,
            correctAnswers: c.correct_answers || 0,
            wrongAnswers: c.wrong_answers || 0,
            streakDays: c.streak_days || 0,
            xpPoints: c.xp_points || 0,
            certDate: c.cert_date || this.certDate,
            certId: c.cert_id || Math.floor(100000 + Math.random() * 900000).toString(),
            skillMastery: Array.isArray(c.skill_mastery) ? c.skill_mastery.map((s: any, i: number) => ({
              topic: s.topic || s.name,
              mastery: s.mastery || 0,
              color: s.color || colors[i % colors.length]
            })) : []
          }));
          this.enrolledCourses.set(courses);
        } else {
          // 🔄 Current single-course backend — wrap as first course
          let cName = 'புறநானூறு - யாப்பு இலக்கணம்';
          if (res.course_name) {
            cName = res.course_name;
          } else if (res.course_progressions?.length > 0) {
            cName = res.course_progressions[0].course_name || res.course_progressions[0].name || cName;
          }
          this.courseName.set(cName);

          const mastery = this.skillMastery();
          const singleCourse: EnrolledCourse = {
            id: 'course-1',
            name: cName,
            completion: this.completionPercentage(),
            accuracy: this.accuracyPercentage(),
            questionsAnswered: this.questionsAnswered(),
            correctAnswers: this.correctAnswers(),
            wrongAnswers: this.wrongAnswers(),
            streakDays: this.streakDays(),
            xpPoints: this.xpPoints(),
            certDate: this.certDate,
            certId: this.certId,
            skillMastery: mastery
          };
          this.enrolledCourses.set([singleCourse]);
        }

        // Default selected course
        const courses = this.enrolledCourses();
        if (courses.length > 0) {
          this.selectedCertCourseId.set(courses[0].id);
          this.selectedStatsCourseId.set(courses[0].id);
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

  /** Returns the currently selected course for Certificates tab */
  get selectedCertCourse(): EnrolledCourse | undefined {
    return this.enrolledCourses().find(c => c.id === this.selectedCertCourseId());
  }

  /** Returns the currently selected course for Statistics tab */
  get selectedStatsCourse(): EnrolledCourse | undefined {
    return this.enrolledCourses().find(c => c.id === this.selectedStatsCourseId());
  }

  selectCertCourse(id: string) {
    this.selectedCertCourseId.set(id);
    this.showCertPreview.set(false);
  }

  selectStatsCourse(id: string) {
    this.selectedStatsCourseId.set(id);
  }

  onMenuClick(item: any) {
    if (item.id) {
      if (item.id === 'personal_info') {
        this.startEditProfile();
      }
      this.activeModal.set(item.id);
    }
  }

  startEditProfile() {
    this.editName.set(this.userName());
    this.editEmail.set(this.userEmail());
    this.editAvatar.set(this.userAvatar());
    this.isEditingProfile.set(false);
    this.profileSuccessMsg.set('');
    this.profileErrorMsg.set('');
  }

  toggleEditMode() {
    this.isEditingProfile.update(v => !v);
    if (this.isEditingProfile()) {
      this.editName.set(this.userName());
      this.editEmail.set(this.userEmail());
      this.editAvatar.set(this.userAvatar());
      this.profileErrorMsg.set('');
    }
  }

  selectPresetAvatar(url: string) {
    this.editAvatar.set(url);
  }

  onAvatarFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        this.profileErrorMsg.set('Image size should be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          this.editAvatar.set(result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  cancelEditProfile() {
    this.isEditingProfile.set(false);
    this.profileErrorMsg.set('');
  }

  saveProfile() {
    const newName = this.editName().trim();
    const newEmail = this.editEmail().trim();

    if (!newName) {
      this.profileErrorMsg.set('Full Name is required.');
      return;
    }

    this.isSavingProfile.set(true);
    this.profileErrorMsg.set('');

    this.authService.updateProfile({
      name: newName,
      email: newEmail,
      avatar: this.editAvatar()
    }).subscribe({
      next: (res) => {
        this.isSavingProfile.set(false);
        const updatedUser = res.user || {};
        this.userName.set(updatedUser.name || newName);
        this.userEmail.set(updatedUser.email || newEmail);
        this.userAvatar.set(updatedUser.avatar || this.editAvatar());
        this.isEditingProfile.set(false);
        this.profileSuccessMsg.set('Profile updated successfully! ✨');
        setTimeout(() => this.profileSuccessMsg.set(''), 4000);
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        const msg = err?.error?.message || (err?.error?.errors ? Object.values(err.error.errors).flat().join(', ') : 'Failed to update profile.');
        this.profileErrorMsg.set(msg);
      }
    });
  }

  toggleCertPreview() {
    this.showCertPreview.update(v => !v);
  }

  downloadPDFCertificate() {
    if (this.completionPercentage() < 100) {
      alert('🔒 Certificate Download is Locked! Complete 100% of the course to download your official certificate.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups in your browser to download your PDF certificate.');
      return;
    }

    const certHtml = `
      <!DOCTYPE html>
      <html lang="ta">
      <head>
        <meta charset="UTF-8">
        <title>Certificate_${(this.userName() || 'Student').replace(/\s+/g, '_')}</title>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { size: landscape; margin: 0; }
          body {
            margin: 0;
            padding: 24px;
            background: #F8FAFC;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            user-select: none;
            -webkit-user-select: none;
          }
          .certificate-card {
            width: 100%;
            max-width: 850px;
            background: linear-gradient(135deg, #FFFDF5 0%, #FFFFFF 100%);
            border: 5px double #F59E0B;
            border-radius: 24px;
            padding: 35px 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            position: relative;
            box-sizing: border-box;
          }
          .badge-tag {
            background: rgba(245, 158, 11, 0.2);
            color: #92400E;
            padding: 6px 18px;
            border-radius: 50px;
            font-weight: 800;
            font-size: 0.9rem;
            display: inline-block;
            margin-bottom: 12px;
            border: 1px solid rgba(245, 158, 11, 0.5);
          }
          .title-ta {
            color: #4F46E5;
            font-size: 2.2rem;
            font-weight: 900;
            margin: 4px 0;
          }
          .subtitle {
            color: #64748B;
            font-size: 0.95rem;
            margin-bottom: 16px;
          }
          .student-name {
            color: #4C1D95;
            font-size: 2.5rem;
            font-weight: 900;
            margin: 12px 0 6px 0;
          }
          .name-line {
            height: 3px;
            width: 160px;
            background: #F59E0B;
            margin: 0 auto 12px auto;
            border-radius: 10px;
          }
          .course-title {
            color: #059669;
            font-size: 1.5rem;
            font-weight: 800;
            margin-bottom: 4px;
          }
          .org-name {
            color: #64748B;
            font-size: 0.9rem;
            font-weight: 700;
          }
          .footer-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 18px;
            border-top: 2px solid #E2E8F0;
          }
          .seal-stamp {
            background: #F59E0B;
            color: white;
            width: 54px;
            height: 54px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
            border: 3px double #FFFFFF;
          }
        </style>
      </head>
      <body>
        <div class="certificate-card">
          <div class="badge-tag">🏆 சான்றிதழ் · Official Certificate</div>
          <div class="title-ta">நிறைவு சான்றிதழ்</div>
          <div class="subtitle">சான்றளிக்கப்படுவது என்னவென்றால்</div>
          
          <div class="student-name">${this.userName() || 'மாணவர் பெயா்'}</div>
          <div class="name-line"></div>
          <div class="subtitle">வெற்றிகரமாக இப்பாடத்திட்டத்தை நிறைவு செய்துள்ளார்</div>
          
          <div class="course-title">${this.courseName()}</div>
          <div class="org-name">${this.studentOrg() || 'Ariga Public School'}</div>

          <div class="footer-bar">
            <div style="text-align: left;">
              <div style="font-size: 0.7rem; color: #64748B; font-weight: 800;">வழங்கப்பட்ட நாள்</div>
              <div style="font-weight: 800; color: #1E293B;">${this.certDate}</div>
            </div>
            <div class="seal-stamp">⭐</div>
            <div style="text-align: right;">
              <div style="font-size: 0.7rem; color: #64748B; font-weight: 800;">சரிபார்க்கப்பட்ட எண்</div>
              <div style="font-weight: 800; color: #4F46E5;">#YAP-${this.certId}</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(certHtml);
    printWindow.document.close();
  }

  openBadgeModal(badge: BadgeDetail) {
    this.selectedBadge.set(badge);
    this.showBadgeModal.set(true);
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6']
      });
    } catch (e) {}
  }

  closeBadgeModal() {
    this.showBadgeModal.set(false);
    this.selectedBadge.set(null);
  }

  closeModal() {
    this.activeModal.set('none');
    this.isEditingProfile.set(false);
    this.showCertPreview.set(false);
    this.profileErrorMsg.set('');
  }

  logout() {
    this.authService.clearSession();
    this.authService.logout().subscribe({ error: () => {} });
    this.router.navigate(['/login']);
  }

  // ── Support Tickets Methods ──────────────────────────────────────────

  fetchMyTickets() {
    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any>(`${environment.apiUrl}/support/my-tickets`, { headers }).subscribe({
      next: (res) => {
        if (res.tickets) {
          this.supportTickets.set(res.tickets);
        }
      },
      error: () => {}
    });
  }

  submitTicket() {
    if (!this.ticketSubject().trim() || !this.ticketMessage().trim()) {
      this.ticketErrorMsg.set('Subject and message are required.');
      return;
    }

    this.isSubmittingTicket.set(true);
    this.ticketErrorMsg.set('');
    this.ticketSuccessMsg.set('');

    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    const payload = {
      subject: this.ticketSubject(),
      message: this.ticketMessage(),
      category: this.ticketCategory(),
      priority: this.ticketPriority()
    };

    this.http.post<any>(`${environment.apiUrl}/support/tickets`, payload, { headers }).subscribe({
      next: (res) => {
        this.isSubmittingTicket.set(false);
        this.ticketSuccessMsg.set(res.message || 'Ticket submitted successfully!');
        
        // Reset form
        this.ticketSubject.set('');
        this.ticketMessage.set('');
        this.ticketCategory.set('general');
        this.ticketPriority.set('normal');
        
        // Refresh list and switch to list view
        this.fetchMyTickets();
        setTimeout(() => {
          this.ticketSuccessMsg.set('');
          this.isViewingTickets.set(true);
        }, 2000);
      },
      error: (err) => {
        this.isSubmittingTicket.set(false);
        this.ticketErrorMsg.set('Failed to submit ticket. Please try again.');
      }
    });
  }

  toggleTicketView() {
    this.isViewingTickets.update(v => !v);
  }
}
