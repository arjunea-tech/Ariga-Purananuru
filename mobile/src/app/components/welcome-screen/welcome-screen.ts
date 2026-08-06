import { Component, signal, inject, OnInit, AfterViewInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

export interface DailyKural {
  number: number;
  chapter: string;
  line1: string;
  line2: string;
  meaning: string;
}

export const THIRUKKURALS: DailyKural[] = [
  {
    number: 1,
    chapter: 'கடவுள் வாழ்த்து (அதிகாரம் 1)',
    line1: 'அகர முதல எழுத்தெல்லாம் ஆதி',
    line2: 'பகவன் முதற்றே உலகு.',
    meaning: 'எழுத்துக்கள் எல்லாம் அகரத்தை அடிப்படையாகக் கொண்டிருக்கின்றன; அதுபோல உலகம் ஆதிபகவனை அடிப்படையாகக் கொண்டிருக்கிறது.'
  },
  {
    number: 391,
    chapter: 'கல்வி (அதிகாரம் 40)',
    line1: 'கற்க கசடறக் கற்பவை கற்றபின்',
    line2: 'நிற்க அதற்குத் தக.',
    meaning: 'கற்கத் தகுந்த நூல்களைக் குற்றமறக் கற்க வேண்டும்; கற்ற பிறகு, அக்கல்விக்குத் தகுந்தவாறு நெறியில் நிற்க வேண்டும்.'
  },
  {
    number: 392,
    chapter: 'கல்வி (அதிகாரம் 40)',
    line1: 'எண்ணென்ப ஏனை எழுத்தென்ப இவ்விரண்டும்',
    line2: 'கண்ணென்ப வாழும் உயிர்க்கு.',
    meaning: 'எண் என்று சொல்லப்படுபவன, எழுத்து என்று சொல்லப்படுபவன ஆகிய இருவகை அறிவும் வாழும் மக்களுக்குக் கண்கள் என்று கூறுவர்.'
  },
  {
    number: 396,
    chapter: 'கல்வி (அதிகாரம் 40)',
    line1: 'தொட்டனைத் தூறும் மணற்கேணி மாந்தர்க்குக்',
    line2: 'கற்றனைத் தூறும் அறிவு.',
    meaning: 'மணற்கேணியில் தோண்டிய அளவிற்கு நீர் ஊறும்; அதுபோல மக்களுக்குக் கற்கும் அளவிற்கு அறிவு வளரும்.'
  },
  {
    number: 397,
    chapter: 'கல்வி (அதிகாரம் 40)',
    line1: 'யாதானும் நாடாமால் ஊராமால் என்னொருவன்',
    line2: 'சாந்துணையும் கல்லாத வாறு.',
    meaning: 'கற்றவனுக்கு எல்லா நாடும் தன் நாடே, எல்லா ஊரும் தன் ஊரே ஆகும்; அப்படி இருக்க ஒருவன் இறக்கும் வரை கல்லாமல் இருப்பது ஏன்?'
  },
  {
    number: 78,
    chapter: 'அன்புடைமை (அதிகாரம் 8)',
    line1: 'அன்பிலார் எல்லாம்தமக்குரியர் அன்புடையார்',
    line2: 'என்பும் உரியர் பிறர்க்கு.',
    meaning: 'அன்பு இல்லாதவர் எல்லாப் பொருளும் தமக்கே உரியது என்பர்; அன்பு உடையவர் தம் உடம்பையும் பிறர்க்கு உரியதாக்கி மகிழ்வர்.'
  },
  {
    number: 97,
    chapter: 'இனியவை கூறல் (அதிகாரம் 10)',
    line1: 'பணிவுடையன் இன்சொலன் ஆதல் ஒருவற்கு',
    line2: 'அணியல்ல மற்றுப் பிற.',
    meaning: 'பணிவுடையவனாகவும் இன்சொல் கூறுபவனாகவும் விளங்குவதே ஒருவனுக்கு மிகச் சிறந்த அணிகலன் ஆகும்; பிற ஆபரணங்கள் அணிகலன்கள் அல்ல.'
  },
  {
    number: 100,
    chapter: 'இனியவை கூறல் (அதிகாரம் 10)',
    line1: 'இனிய உளவாக இன்னாத கூறல்',
    line2: 'கனிஇருப்பக் காய்கவர்ந் தற்று.',
    meaning: 'இன்பம் தரும் இனிய சொற்கள் இருக்கும்போது துன்பம் தரும் வன்சொற்களைப் பேசுவது, சுவையான பழங்கள் இருக்கும்போது பச்சைக் காயைத் தின்பதற்கு ஒப்பானது.'
  },
  {
    number: 105,
    chapter: 'செய்ந்நன்றியறிதல் (அதிகாரம் 11)',
    line1: 'காலத்தினால் செய்த நன்றி சிறிது எனினும்',
    line2: 'ஞாலத்தின் மாணப் பெரிது.',
    meaning: 'தக்க காலத்தில் ஒருவன் செய்த உதவி அளவில் சிறியதாக இருந்தாலும், அதன் தன்மையை ஆராய்ந்தால் அது உலகத்தை விடப் பெரியதாகும்.'
  },
  {
    number: 110,
    chapter: 'செய்ந்நன்றியறிதல் (அதிகாரம் 11)',
    line1: 'எந்நன்றி கொன்றார்க்கும் உய்வுண்டாம் உய்வில்லை',
    line2: 'செய்ந்நன்றி கொன்ற மகற்கு.',
    meaning: 'எந்த அறத்தை அழித்தவர்க்கும் தப்பிப் பிழைக்க வழியுண்டு; ஆனால், ஒருவர் செய்த உதவியை மறந்து அழித்தவனுக்குப் பிழைக்க வழியே இல்லை.'
  },
  {
    number: 131,
    chapter: 'ஒழுக்கமுடைமை (அதிகாரம் 14)',
    line1: 'ஒழுக்கம் விழுப்பந் தரலான் ஒழுக்கம்',
    line2: 'உயிரினும் ஓம்பப் படும்.',
    meaning: 'ஒழுக்கம் எல்லார்க்கும் சிறப்பைத் தருவதாக இருப்பதால், அந்த ஒழுக்கத்தை உயிரைவிடக் காட்டிலும் மேலானதாகப் போற்றிக் காக்க வேண்டும்.'
  },
  {
    number: 291,
    chapter: 'வாய்மை (அதிகாரம் 30)',
    line1: 'வாய்மை எனப்படுவது யாதெனின் யாதொன்றும்',
    line2: 'தீமை இலாத சொலல்.',
    meaning: 'வாய்மை என்று சொல்லப்படுபவது எதுவென்றால், அது பிறருக்கு எள்முனையளவும் தீமை தராத சொற்களைச் சொல்லுவதாகும்.'
  },
  {
    number: 411,
    chapter: 'கேள்வி (அதிகாரம் 42)',
    line1: 'செல்வத்துள் செல்வம் செவிச்செல்வம் அச்செல்வம்',
    line2: 'செல்வத்துள் எல்லாம் தலை.',
    meaning: 'செல்வங்கள் எல்லாவற்றிலும் தலைசிறந்த செல்வம் செவியால் கேட்டுப் பெறும் கேள்வியறிவாகும்; அச்செல்வம் மற்ற எல்லாச் செல்வங்களையும் விட மேலானது.'
  },
  {
    number: 423,
    chapter: 'அறிவுடைமை (அதிகாரம் 43)',
    line1: 'எப்பொருள் யார்யார்வாய்க் கேட்பினும் அப்பொருள்',
    line2: 'மெய்ப்பொருள் காண்பது அறிவு.',
    meaning: 'எந்தப் பொருளை யார் யார் சொல்லக் கேட்டாலும், அந்தப் பொருளின் உண்மைத் தன்மையை ஆராய்ந்து காண்பதே அறிவாகும்.'
  },
  {
    number: 619,
    chapter: 'ஆள்வினையுடைமை (அதிகாரம் 62)',
    line1: 'தெய்வத்தான் ஆகா தெனினும் முயற்சிதன்',
    line2: 'மெய்வருத்தக் கூலி தரும்.',
    meaning: 'விதியின் காரணத்தால் ஒரு காரியம் நிறைவேறாமல் போனாலும், முயற்சி செய்தால் அதற்கேற்ற உடலுழைப்பின் கூலி நிச்சயமாகக் கிடைக்கும்.'
  },
  {
    number: 621,
    chapter: 'இடுக்கணழியாமை (அதிகாரம் 63)',
    line1: 'இடுக்கண் வருங்கால் நகுக அதனை',
    line2: 'அடுத்தூர்வது அஃதொப்பது இல்.',
    meaning: 'துன்பம் வரும்போது மனம் தளராமல் சிரிக்க வேண்டும்; அந்தத் துன்பத்தை வெல்ல அதைவிடச் சிறந்த வழி வேறு எதுவும் இல்லை.'
  }
];

export interface OfferedCourse {
  id: number;
  title: string;
  category: string;
  description: string;
  lessonsCount: number;
  gamesCount: number;
  badgeBg: string;
  badgeColor: string;
  icon: string;
  isFeatured?: boolean;
}

export interface FeatureCard {
  id: string;
  title: string;
  desc: string;
  icon: string;
  bgClass: string;
  color: string;
}

export interface ImpactStat {
  value: string;
  label: string;
}

export interface AwardItem {
  id: number;
  title: string;
  year: string;
  organization: string;
  imageUrl: string;
}

export interface TestimonialItem {
  id: number;
  name: string;
  role: string;
  comment: string;
  avatarIcon: string;
  badgeBg: string;
  badgeColor: string;
}

@Component({
  selector: 'app-welcome-screen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './welcome-screen.html',
  styleUrls: ['./welcome-screen.css']
})
export class WelcomeScreen implements OnInit, AfterViewInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private el = inject(ElementRef);
  protected authService = inject(AuthService);

  isMobileMenuOpen = signal<boolean>(false);
  showBackToTop = signal<boolean>(false);
  isScrolled = signal<boolean>(false);
  kuralCopied = signal<boolean>(false);
  activeTestimonialIndex = signal<number>(0);
  isTestimonialPaused = false;
  private testimonialTimer: any;

  // Statistics Animated Counters
  statStudents = signal<number>(0);
  statLessons = signal<number>(0);
  statSatisfaction = signal<number>(0);
  statExercises = signal<number>(0);
  hasAnimatedCounters = false;

  todayFormattedDate: string = new Date().toLocaleDateString('ta-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Daily Thirukkural Feature
  dailyKural = signal<DailyKural>({
    number: 391,
    chapter: 'கல்வி (அதிகாரம் 40)',
    line1: 'கற்க கசடறக் கற்பவை கற்றபின்',
    line2: 'நிற்க அதற்குத் தக.',
    meaning: 'கற்கத் தகுந்த நூல்களைக் குற்றமறக் கற்க வேண்டும்; கற்ற பிறகு, அக்கல்விக்குத் தகுந்தவாறு நெறியில் நிற்க வேண்டும்.'
  });

  // Featured Course Offered
  offeredCourses: OfferedCourse[] = [
    {
      id: 1,
      title: 'அழகுத் தமிழ் யாப்பு (யாப்பிலக்கணம்)',
      category: 'செய்யுள் இலக்கணம்',
      description: 'யாப்பிலக்கணம் என்பது தமிழின் செய்யுள் (மரபுக்கவிதை) எழுதுவதற்கான இலக்கணத்தை விளக்குகிறது. அசை, சீர், தளை, அடி மற்றும் தொடை அமைப்புகளை விளையாட்டு வடிவில் எளிதாகக் கற்கலாம்.',
      lessonsCount: 18,
      gamesCount: 8,
      badgeBg: '#EEF2FF',
      badgeColor: '#4F46E5',
      icon: 'bi-journal-code',
      isFeatured: true
    }
  ];

  // Dynamic Courses Signal loaded directly from Backend DB
  dynamicCourses = signal<any[]>([]);
  isLoadingCourses = signal<boolean>(true);

  // Contact Form Signals
  contactName = signal<string>('');
  contactEmail = signal<string>('');
  contactSubject = signal<string>('');
  contactMessage = signal<string>('');
  isSubmittingContact = signal<boolean>(false);
  contactSuccessMsg = signal<string>('');

  // Newsletter Signal
  newsletterEmail = signal<string>('');
  newsletterSubscribed = signal<boolean>(false);

  subscribeNewsletter(): void {
    if (!this.newsletterEmail()) return;
    this.newsletterSubscribed.set(true);
    this.newsletterEmail.set('');
    setTimeout(() => this.newsletterSubscribed.set(false), 4000);
  }

  // 4 General Core Platform Pillars (Common Tamil Learning)
  featureCards: FeatureCard[] = [
    {
      id: 'foundation',
      title: 'அடிப்படைக் கற்றல்',
      desc: 'உயிரெழுத்துக்கள், மெய்யெழுத்துக்கள் மற்றும் சொல் உருவாக்கம்.',
      icon: 'bi-book-half',
      bgClass: 'bg-pastel-mint',
      color: '#00A896'
    },
    {
      id: 'grammar',
      title: 'இலக்கண அறிவு',
      desc: 'எழுத்து, சொல், யாப்பு மற்றும் அணி இலக்கணங்களின் எளிய விளக்கங்கள்.',
      icon: 'bi-journal-richtext',
      bgClass: 'bg-pastel-pink',
      color: '#EC4899'
    },
    {
      id: 'games',
      title: 'விளையாட்டுப் பயிற்சிகள்',
      desc: 'அசை வெட்டு, சீர்ப் புதிர், வார்த்தை வேட்டை போன்ற சுவாரஸ்யமான விளையாட்டுகள்.',
      icon: 'bi-controller',
      bgClass: 'bg-pastel-blue',
      color: '#0284C7'
    },
    {
      id: 'analytics',
      title: 'முன்னேற்ற அறிக்கை',
      desc: 'தினசரித் தொடர் கற்றல், புள்ளிகள் மற்றும் சான்றிதழ் சான்றுகள்.',
      icon: 'bi-trophy-fill',
      bgClass: 'bg-pastel-lavender',
      color: '#9333EA'
    }
  ];

  // Awards Data
  awards: AwardItem[] = [
    {
      id: 1,
      title: 'சிறந்த தமிழ் கல்விக் கருவி செயலி',
      year: '2025',
      organization: 'தமிழ் டிஜிட்டல் அகாடமி',
      imageUrl: 'assets/images/welcome_hero.png'
    },
    {
      id: 2,
      title: 'கல்விக்கூடப் புதுமை விருது',
      year: '2024',
      organization: 'உலகத் தமிழ்ச் சங்கம்',
      imageUrl: 'assets/images/login_hero.png'
    },
    {
      id: 3,
      title: 'இளையோர் கற்றல் விருது',
      year: '2024',
      organization: 'உலகத் தமிழ் மன்றம்',
      imageUrl: 'assets/images/logo.png'
    }
  ];

  // Student & Teacher Testimonials
  testimonials: TestimonialItem[] = [
    {
      id: 1,
      name: 'முனைவர் க. சுப்பிரமணியன்',
      role: 'தமிழ் விரிவுரையாளர்',
      comment: 'அழகுத் தமிழ் யாப்பு செயலி மூலம் மாணவர்கள் செய்யுள் அசை பிரித்தலை மிக எளிதாகப் புரிந்து கொள்கிறார்கள். வகுப்பறைக் கற்பித்தல் மிகவும் சுலபமாகிவிட்டது!',
      avatarIcon: 'bi-person-workspace',
      badgeBg: '#EEF2FF',
      badgeColor: '#4F46E5'
    },
    {
      id: 2,
      name: 'செல்வி கனிமொழி',
      role: '9ஆம் வகுப்பு மாணவி',
      comment: 'அசை வெட்டு விளையாட்டை விளையாடிக்கொண்டே யாப்பிலக்கணம் கற்றுக்கொண்டேன். என் பள்ளித் தேர்வில் அதிக மதிப்பெண் பெற இது மிகவும் உதவியது!',
      avatarIcon: 'bi-mortarboard-fill',
      badgeBg: '#ECFDF5',
      badgeColor: '#10B981'
    },
    {
      id: 3,
      name: 'கவிஞர் தமிழ்பெருமாள்',
      role: 'மரபுக் கவிஞர் & தமிழ் ஆர்வலர்',
      comment: 'மரபுக் கவிதைகள் எழுத விரும்பும் புதிய தலைமுறையினருக்கு இந்த யாப்பிலக்கண இயங்குதளம் ஒரு சிறந்த வழிகாட்டியாகும். மிக அருமையான முயற்சி!',
      avatarIcon: 'bi-pen-fill',
      badgeBg: '#FEF3C7',
      badgeColor: '#D97706'
    }
  ];

  private getScrollEl(): HTMLElement | null {
    return document.getElementById('landingScrollBody');
  }

  @HostListener('scroll', ['$event'])
  onWindowScroll(event?: Event): void {
    const hostEl = this.el.nativeElement as HTMLElement;
    const scrollPos = hostEl.scrollTop || 0;
    this.showBackToTop.set(scrollPos > 300);
    this.isScrolled.set(scrollPos > 40);

    // Parallax effect on mesh blur orbs
    const orbs = (this.el.nativeElement as HTMLElement).querySelectorAll('.mesh-blur-orb');
    orbs.forEach((orb: any, idx: number) => {
      const speed = (idx + 1) * 0.15;
      orb.style.transform = `translateY(${scrollPos * speed}px)`;
    });
  }

  ngOnInit(): void {
    this.setDailyKuralBasedOnDate();
    this.fetchCoursesFromBackend();
    this.startTestimonialAutoplay();
  }

  setDailyKuralBasedOnDate(): void {
    try {
      const today = new Date();
      const start = new Date(today.getFullYear(), 0, 0);
      const diff = today.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      
      const index = dayOfYear % THIRUKKURALS.length;
      this.dailyKural.set(THIRUKKURALS[index]);
    } catch (e) {
      console.error('Failed to set daily kural:', e);
    }
  }

  ngAfterViewInit(): void {
    this.setupScrollObserver();
    // Bind scroll listener to the real scroll container
    const scrollEl = this.getScrollEl();
    if (scrollEl) {
      scrollEl.addEventListener('scroll', () => this.onWindowScroll(), { passive: true });
    }
  }

  setupScrollObserver(): void {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            if (entry.target.id === 'impact' && !this.hasAnimatedCounters) {
              this.animateCounters();
            }
          }
        });
      }, { threshold: 0.15 });

      const targets = this.el.nativeElement.querySelectorAll('.reveal-on-scroll, #impact');
      targets.forEach((target: Element) => observer.observe(target));
    } else {
      const targets = this.el.nativeElement.querySelectorAll('.reveal-on-scroll');
      targets.forEach((target: Element) => target.classList.add('in-view'));
      this.animateCounters();
    }
  }

  animateCounters(): void {
    this.hasAnimatedCounters = true;
    this.countUp(0, 50000, 1800, (val) => this.statStudents.set(val));
    this.countUp(0, 1500, 1800, (val) => this.statLessons.set(val));
    this.countUp(0, 98, 1800, (val) => this.statSatisfaction.set(val));
    this.countUp(0, 1000000, 1800, (val) => this.statExercises.set(val));
  }

  countUp(start: number, end: number, duration: number, callback: (val: number) => void): void {
    const steps = 40;
    const stepTime = duration / steps;
    const increment = (end - start) / steps;
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        current = end;
        clearInterval(timer);
      }
      callback(Math.floor(current));
    }, stepTime);
  }

  startTestimonialAutoplay(): void {
    this.testimonialTimer = setInterval(() => {
      if (!this.isTestimonialPaused) {
        this.activeTestimonialIndex.update(idx => (idx + 1) % this.testimonials.length);
      }
    }, 5000);
  }

  pauseTestimonialAutoplay(): void {
    this.isTestimonialPaused = true;
  }

  resumeTestimonialAutoplay(): void {
    this.isTestimonialPaused = false;
  }

  copyKural(): void {
    const text = `திருக்குறள் #${this.dailyKural().number} (${this.dailyKural().chapter}):\n${this.dailyKural().line1}\n${this.dailyKural().line2}\n\nபொருள்: ${this.dailyKural().meaning}\n- அழகுத் தமிழ் யாப்பு`;
    navigator.clipboard.writeText(text).then(() => {
      this.kuralCopied.set(true);
      setTimeout(() => this.kuralCopied.set(false), 2500);
    });
  }

  fetchCoursesFromBackend(): void {
    this.isLoadingCourses.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/courses`).subscribe({
      next: (courses) => {
        if (courses && Array.isArray(courses)) {
          const activeList = courses.filter(c => c.is_active !== false);
          this.dynamicCourses.set(activeList);
        } else {
          this.dynamicCourses.set([]);
        }
        this.isLoadingCourses.set(false);
      },
      error: (err) => {
        console.log('Error fetching courses for landing page:', err);
        this.dynamicCourses.set([]);
        this.isLoadingCourses.set(false);
      }
    });
  }

  getCourseIcon(index: number): string {
    const icons = ['bi-journal-code', 'bi-book-fill', 'bi-pen-fill', 'bi-star-fill', 'bi-journal-bookmark-fill'];
    return icons[index % icons.length];
  }

  getBadgeBg(index: number): string {
    const bgs = ['#EEF2FF', '#ECFDF5', '#FEF3C7', '#F3E8FF', '#E0F2FE'];
    return bgs[index % bgs.length];
  }

  getBadgeColor(index: number): string {
    const colors = ['#4F46E5', '#10B981', '#D97706', '#7C3AED', '#0284C7'];
    return colors[index % colors.length];
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  scrollToSection(sectionId: string): void {
    this.closeMobileMenu();
    const hostEl = this.el.nativeElement as HTMLElement;
    const el = document.getElementById(sectionId);
    if (el && hostEl) {
      const offset = el.getBoundingClientRect().top + hostEl.scrollTop;
      hostEl.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }

  scrollToTop(): void {
    const hostEl = this.el.nativeElement as HTMLElement;
    if (hostEl) hostEl.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToLogin(): void {
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getUserRole();
      if (role === 'student') {
        this.router.navigate(['/web-dashboard']);
      } else {
        this.router.navigate(['/admin-dashboard']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  submitContactForm(): void {
    if (!this.contactName() || !this.contactEmail() || !this.contactMessage()) {
      return;
    }
    this.isSubmittingContact.set(true);
    setTimeout(() => {
      this.isSubmittingContact.set(false);
      this.contactSuccessMsg.set('உங்கள் செய்தி வெற்றிகரமாக அனுப்பப்பட்டது! விரைவில் தொடர்புகொள்வோம்.');
      this.contactName.set('');
      this.contactEmail.set('');
      this.contactSubject.set('');
      this.contactMessage.set('');
      setTimeout(() => this.contactSuccessMsg.set(''), 5000);
    }, 1200);
  }
}
