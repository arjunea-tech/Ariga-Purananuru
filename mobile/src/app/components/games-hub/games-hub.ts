import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface EducationalGame {
  id: string;
  moduleId: string;
  moduleTa: string;
  titleTa: string;
  titleEn: string;
  descriptionTa: string;
  icon: string;
  badgeBg: string;
  xpReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  modeKey: string;
}

@Component({
  selector: 'app-games-hub',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './games-hub.html',
  styleUrls: ['./games-hub.css']
})
export class GamesHubComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  viewState = signal<'courses' | 'categories'>('courses');
  availableCourses = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  selectedModule = signal<string>('all');

  modules = signal<{ id: string; label: string }[]>([
    { id: 'all', label: 'அனைத்தும்' }
  ]);

  allGames = signal<EducationalGame[]>([
    // எழுத்து (Ezhuthu)
    {
      id: 'ezhuthu-1',
      moduleId: 'ezhuthu',
      moduleTa: 'எழுத்து',
      titleTa: 'உயிர் & மெய் வினாடி-வினா',
      titleEn: 'Vowels & Consonants Quiz',
      descriptionTa: 'உயிர் (12) மற்றும் மெய் (18) எழுத்துக்களைக் கண்டறிந்து விடையளி!',
      icon: 'bi-card-checklist',
      badgeBg: '#6C5CE7',
      xpReward: 50,
      difficulty: 'Easy',
      modeKey: 'mcq'
    },
    {
      id: 'ezhuthu-2',
      moduleId: 'ezhuthu',
      moduleTa: 'எழுத்து',
      titleTa: 'ஆய்த எழுத்து பொருத்துதல்',
      titleEn: 'Aytham Letter Matching',
      descriptionTa: 'சொற்களில் ஆய்த எழுத்து (ஃ) இருக்கும் இடத்தை பொருத்து!',
      icon: 'bi-grid-3x3-gap-fill',
      badgeBg: '#E17055',
      xpReward: 50,
      difficulty: 'Easy',
      modeKey: 'match'
    },
    {
      id: 'ezhuthu-3',
      moduleId: 'ezhuthu',
      moduleTa: 'எழுத்து',
      titleTa: 'சார்பெழுத்து புதிர்',
      titleEn: 'Compound Letter Puzzle',
      descriptionTa: 'உயிர்மெய் மற்றும் சார்பெழுத்துக்களை உருவாக்கும் புதிர்!',
      icon: 'bi-puzzle-fill',
      badgeBg: '#00CEC9',
      xpReward: 60,
      difficulty: 'Medium',
      modeKey: 'build'
    },

    // அசை (Asai)
    {
      id: 'asai-1',
      moduleId: 'asai',
      moduleTa: 'அசை',
      titleTa: 'நேரசை - நிரையசை சவால்',
      titleEn: 'Ner & Nirai Asai Quiz',
      descriptionTa: 'சொற்களின் குறில், நெடில், மெய் அசை பிரித்து நேரசையா நிரையசையா என விடையளி!',
      icon: 'bi-lightning-charge-fill',
      badgeBg: '#00B894',
      xpReward: 75,
      difficulty: 'Medium',
      modeKey: 'mcq'
    },
    {
      id: 'asai-2',
      moduleId: 'asai',
      moduleTa: 'அசை',
      titleTa: 'அசை பிரித்தல் மேட்ச்',
      titleEn: 'Asai Syllabification Match',
      descriptionTa: 'சொற்களை அவற்றின் சரியான அசை பிரிப்புடன் பொருத்து!',
      icon: 'bi-grid-3x3-gap-fill',
      badgeBg: '#FD79A8',
      xpReward: 75,
      difficulty: 'Medium',
      modeKey: 'match'
    },
    {
      id: 'asai-3',
      moduleId: 'asai',
      moduleTa: 'அசை',
      titleTa: 'வேக அசை பந்தயம்',
      titleEn: 'Speed Asai Challenge',
      descriptionTa: 'குறிப்பிட்ட நேரத்தில் அதிக அசை சொற்களை சரியாக கண்டுபிடி!',
      icon: 'bi-stopwatch-fill',
      badgeBg: '#FF7675',
      xpReward: 80,
      difficulty: 'Hard',
      modeKey: 'speed'
    },

    // சீர் (Seer)
    {
      id: 'seer-1',
      moduleId: 'seer',
      moduleTa: 'சீர்',
      titleTa: 'ஓரசை & ஈரசைச்சீர் வினாடி-வினா',
      titleEn: 'Metrical Feet Quiz',
      descriptionTa: 'நாள், மலர், காசு, பிறப்பு வாய்ப்பாடுகளை சரியாக கண்டுபிடி!',
      icon: 'bi-card-checklist',
      badgeBg: '#0984E3',
      xpReward: 100,
      difficulty: 'Medium',
      modeKey: 'mcq'
    },
    {
      id: 'seer-2',
      moduleId: 'seer',
      moduleTa: 'சீர்',
      titleTa: 'மூவசைச்சீர் பொருத்துதல்',
      titleEn: 'Three Syllable Seer Match',
      descriptionTa: 'தேமாங்காய், புளிமாங்காய் வாய்ப்பாடுகளை பொருத்து!',
      icon: 'bi-puzzle-fill',
      badgeBg: '#6C5CE7',
      xpReward: 100,
      difficulty: 'Hard',
      modeKey: 'match'
    },

    // தளை (Thalai)
    {
      id: 'thalai-1',
      moduleId: 'thalai',
      moduleTa: 'தளை',
      titleTa: '7 வகை தளைகள் சவால்',
      titleEn: '7 Poetic Meter Links',
      descriptionTa: 'நின்ற சீர் ஈற்றசையும் வரும் சீர் முதலசையும் பொருந்தும் தளை கண்டறி!',
      icon: 'bi-trophy-fill',
      badgeBg: '#FDCB6E',
      xpReward: 120,
      difficulty: 'Hard',
      modeKey: 'mcq'
    },

    // அளகிடுதல் (Alagidhal)
    {
      id: 'alagidhal-1',
      moduleId: 'alagidhal',
      moduleTa: 'அளகிடுதல்',
      titleTa: 'திருக்குறள் அலகிடுதல் மாஸ்டர்',
      titleEn: 'Kural Metrical Master',
      descriptionTa: 'திருக்குறள் மற்றும் புறநானூற்று அடிகளை முழுமையாக அலகிட்டு சாதி!',
      icon: 'bi-award-fill',
      badgeBg: '#E84393',
      xpReward: 150,
      difficulty: 'Hard',
      modeKey: 'mcq'
    }
  ]);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['view'] === 'categories') {
        this.viewState.set('categories');
      } else {
        this.viewState.set('courses');
      }
    });

    this.loadDynamicCoursesAndModules();
  }

  coursePage = signal<number>(1);
  coursesTotal = signal<number>(0);
  coursesLastPage = signal<number>(1);
  isLoadingMoreCourses = signal<boolean>(false);
  courseSearchQuery = signal<string>('');
  coursesPerPage = 10;
  private searchDebounceTimer: any;

  private loadDynamicCoursesAndModules() {
    this.isLoading.set(true);
    this.loadCoursesPage(1, false, true);
  }

  /** Load a page of courses (with optional search). Appends to list when page > 1. */
  loadCoursesPage(page: number = 1, append: boolean = false, isInitialLoad: boolean = false): void {
    if (append) {
      this.isLoadingMoreCourses.set(true);
    }

    const search = this.courseSearchQuery();
    let url = `${environment.apiUrl}/courses?per_page=${this.coursesPerPage}&page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const items: any[] = Array.isArray(res) ? res : (res.data || []);
        const total: number = res.total ?? items.length;
        const lastPage: number = res.last_page ?? 1;

        this.coursesTotal.set(total);
        this.coursesLastPage.set(lastPage);
        this.coursePage.set(page);

        const activeCourses = items.filter(c => c.is_active !== false);
        const listToUse = activeCourses.length > 0 ? activeCourses : items;

        if (append) {
          this.availableCourses.update(existing => [...existing, ...listToUse]);
        } else {
          this.availableCourses.set(listToUse);
        }

        if (isInitialLoad && this.availableCourses().length > 0) {
           const targetCourseId = this.availableCourses()[0].id;
           this.fetchCourseStructure(targetCourseId);
        }

        this.isLoading.set(false);
        this.isLoadingMoreCourses.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.isLoadingMoreCourses.set(false);
        console.error('Failed to load courses from DB:', err);
      }
    });
  }

  /** Load the next page of courses (called when user scrolls to bottom). */
  loadMoreCourses(): void {
    const nextPage = this.coursePage() + 1;
    if (nextPage > this.coursesLastPage() || this.isLoadingMoreCourses()) return;
    this.loadCoursesPage(nextPage, true);
  }

  /** Called on search input change — debounced 300ms */
  onCourseSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.courseSearchQuery.set(value);
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.loadCoursesPage(1, false);
    }, 300);
  }

  fetchCourseStructure(courseId: number | string): void {
    this.http.get<any>(`${environment.apiUrl}/courses/${courseId}/player-structure`).subscribe({
      next: (struct) => {
        if (struct && struct.levels && Array.isArray(struct.levels) && struct.levels.length > 0) {
          const practiceLevels = struct.levels.filter((lvl: any) => {
            const name = (lvl.name || lvl.title || '').trim();
            return !name.includes('அறிமுகம்') && !name.includes('yappu_intro') && !name.includes('intro');
          });

          const dynamicMods = [
            { id: 'all', label: 'அனைத்தும்' },
            ...practiceLevels.map((lvl: any, index: number) => ({
              id: lvl.id ? lvl.id.toString() : `level_${index + 1}`,
              label: lvl.name || `நிலை ${index + 1}`
            }))
          ];
          this.modules.set(dynamicMods);
        }
      },
      error: () => {}
    });
  }

  filteredGames = computed(() => {
    const mod = this.selectedModule();
    if (mod === 'all') return this.allGames();
    return this.allGames().filter(g => g.moduleId === mod);
  });

  selectModule(moduleId: string) {
    this.selectedModule.set(moduleId);
  }

  launchGame(game: EducationalGame) {
    this.router.navigate(['/learn/practice'], {
      queryParams: {
        module: game.moduleId
      }
    });
  }

  openCourse(course: any) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const courseId = (course && course.id) ? course.id : (this.availableCourses() && this.availableCourses()[0]?.id) || 1;
    this.fetchCourseStructure(courseId);
    this.router.navigate([], { relativeTo: this.route, queryParams: { view: 'categories' }, queryParamsHandling: 'merge' });
  }
  
  goBackToCourses() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    this.router.navigate([], { relativeTo: this.route, queryParams: { view: null }, queryParamsHandling: 'merge' });
  }

  goBackToHome() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    this.router.navigate(['/tabs/home']);
  }

  launchPracticeEngine(moduleId: string, moduleLabel?: string) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    this.router.navigate(['/learn/practice'], {
      queryParams: {
        module: moduleId,
        moduleName: moduleLabel
      }
    });
  }

  private modulePalettes = [
    { color: '#8B5CF6', bg: '#F3E8FF', badgeBg: '#EDE9FE', badgeText: '#7C3AED' },
    { color: '#38BDF8', bg: '#E0F2FE', badgeBg: '#E0F2FE', badgeText: '#0284C7' },
    { color: '#10B981', bg: '#D1FAE5', badgeBg: '#D1FAE5', badgeText: '#059669' },
    { color: '#F59E0B', bg: '#FEF3C7', badgeBg: '#FEF3C7', badgeText: '#D97706' },
    { color: '#EC4899', bg: '#FCE7F3', badgeBg: '#FCE7F3', badgeText: '#DB2777' },
    { color: '#6366F1', bg: '#E0E7FF', badgeBg: '#E0E7FF', badgeText: '#4F46E5' },
    { color: '#F97316', bg: '#FFEDD5', badgeBg: '#FFEDD5', badgeText: '#EA580C' }
  ];

  // First letter of the module label as icon
  getModuleFirstLetter(label: string): string {
    return (label || '').trim().charAt(0) || '•';
  }

  getModuleColor(modId: string, index: number): string {
    return this.modulePalettes[index % this.modulePalettes.length].color;
  }

  getModuleBg(modId: string, index: number): string {
    return this.modulePalettes[index % this.modulePalettes.length].bg;
  }

  getModuleBadgeStyle(modId: string, index: number) {
    const p = this.modulePalettes[index % this.modulePalettes.length];
    return { 'background-color': p.badgeBg, 'color': p.badgeText };
  }
}
