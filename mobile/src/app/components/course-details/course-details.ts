import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-details.html',
  styleUrls: ['./course-details.css']
})
export class CourseDetails implements OnInit {
  courseId: number | null = null;
  course = signal<any>(null);
  syllabus = signal<any>(null);
  loading = signal(true);
  loadingSyllabus = signal(false);
  buying = signal(false);
  apiUrl = environment.apiUrl;

  isFromStore = computed(() => {
    return this.route.snapshot.queryParamMap.get('from') === 'store';
  });

  totalLessons = computed(() => {
    const s = this.syllabus();
    if (!s || !s.levels) return 0;
    return s.levels.reduce((sum: number, lvl: any) => sum + (lvl.chapters?.length || 0), 0);
  });

  totalActivities = computed(() => {
    const s = this.syllabus();
    if (!s || !s.levels) return 0;
    
    let count = 0;
    s.levels.forEach((lvl: any) => {
      if (lvl.chapters) {
        lvl.chapters.forEach((ch: any) => {
          // 1. Count activities inside chapter contents (embedded EditorJS blocks)
          if (ch.contents) {
            ch.contents.forEach((cont: any) => {
              if (cont.text_content) {
                try {
                  const parsed = typeof cont.text_content === 'string' ? JSON.parse(cont.text_content) : cont.text_content;
                  if (parsed && parsed.blocks) {
                    parsed.blocks.forEach((block: any) => {
                      if (block.type === 'activity') {
                        count++;
                      }
                    });
                  }
                } catch (e) {}
              }
            });
          }
          // 2. Count assessments as activities
          if (ch.assessments) {
            count += ch.assessments.length;
          }
        });
      }
    });
    return count;
  });

  totalLevels = computed(() => {
    const s = this.syllabus();
    if (!s || !s.levels) return 0;
    return s.levels.length;
  });

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.courseId) { this.fetchCourseData(); }
  }

  fetchCourseData() {
    this.loading.set(true);
    const timeout = setTimeout(() => { if (this.loading()) { this.loading.set(false); } }, 10000);

    this.http.get<any[]>(`${this.apiUrl}/store/courses`).subscribe({
      next: (courses) => {
        clearTimeout(timeout);
        if (courses && Array.isArray(courses)) {
          const found = courses.find(c => Number(c.id) === Number(this.courseId));
          this.course.set(found || null);
        }
        this.loading.set(false);
        if (this.course()) { this.fetchSyllabus(); }
      },
      error: (err) => {
        clearTimeout(timeout);
        console.error('Failed to load course details', err);
        this.loading.set(false);
      }
    });
  }

  fetchSyllabus() {
    this.loadingSyllabus.set(true);
    this.http.get(`${this.apiUrl}/courses/${this.courseId}/player-structure`).subscribe({
      next: (res: any) => { this.syllabus.set(res); this.loadingSyllabus.set(false); },
      error: (err) => { console.error('Failed to load syllabus', err); this.loadingSyllabus.set(false); }
    });
  }

  goBack() {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'store') {
      this.router.navigate(['/tabs/store']);
    } else {
      this.router.navigate(['/']);
    }
  }

  enrollCourse() {
    if (!this.course()) return;
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/signup'], { queryParams: { buy_course: this.course().id } });
      return;
    }
    this.buying.set(true);
    this.http.post<any>(`${this.apiUrl}/payment/order`, { course_id: this.course()?.id }).subscribe({
      next: () => {
        this.buying.set(false);
        const from = this.route.snapshot.queryParamMap.get('from');
        this.notificationService.alert({
          title: 'வெற்றி! (Success)',
          message: 'வகுப்பு வெற்றிகரமாக வாங்கப்பட்டது! பாடப்பிரிவை இப்போது நீங்கள் பயிலலாம். (Course unlocked successfully!)',
          type: 'success',
          onConfirm: () => {
            this.router.navigate([from === 'store' ? '/tabs/store' : '/tabs/learn']);
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.buying.set(false);
        this.router.navigate(['/signup'], { queryParams: { buy_course: this.course().id } });
      }
    });
  }

  get levelsList(): any[] { return this.syllabus()?.levels || []; }
}
