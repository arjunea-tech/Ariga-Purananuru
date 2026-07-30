import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-student-tabs',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './student-tabs.html',
  styleUrls: ['./student-tabs.css']
})
export class StudentTabsComponent {
  private router = inject(Router);

  activeTab = signal<string>('home');

  tabs = [
    { id: 'home', label: 'Home', icon: 'bi-house-door-fill', route: '/tabs/home', color: '#0EA5E9' }, /* Bright Sky Blue */
    { id: 'learn', label: 'Learn', icon: 'bi-book-half', route: '/tabs/learn', color: '#10B981' }, /* Emerald Green */
    { id: 'games', label: 'Practice', icon: 'bi-controller', route: '/tabs/games', color: '#F59E0B' }, /* Bright Amber/Orange */
    { id: 'progress', label: 'Progress', icon: 'bi-bar-chart-line-fill', route: '/tabs/progress', color: '#8B5CF6' }, /* Soft Purple */
    { id: 'profile', label: 'Profile', icon: 'bi-person-circle', route: '/tabs/profile', color: '#F43F5E' } /* Bright Rose */
  ];

  constructor() {
    let previousUrl = '';
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      const urlWithoutParams = url.split('?')[0];

      if (urlWithoutParams.includes('/learn')) this.activeTab.set('learn');
      else if (urlWithoutParams.includes('/games')) this.activeTab.set('games');
      else if (urlWithoutParams.includes('/progress')) this.activeTab.set('progress');
      else if (urlWithoutParams.includes('/profile')) this.activeTab.set('profile');
      else this.activeTab.set('home');

      if (previousUrl !== urlWithoutParams) {
        this.scrollToTop();
        previousUrl = urlWithoutParams;
      }
    });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const tabContent = document.querySelector('.tab-content-area');
      if (tabContent) {
        tabContent.scrollTop = 0;
      }
      const scrollables = document.querySelectorAll('.games-hub-page, .container-fluid, ion-content, .card');
      scrollables.forEach(el => { el.scrollTop = 0; });
    }, 0);

    setTimeout(() => {
      const tabContent = document.querySelector('.tab-content-area');
      if (tabContent) {
        tabContent.scrollTop = 0;
      }
    }, 50);
  }

  animationClass = signal<string>('');

  private touchStartX = 0;
  private touchStartY = 0;

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const diffX = touchEndX - this.touchStartX;
    const diffY = touchEndY - this.touchStartY;

    // Detect horizontal swipes only if horizontal displacement is greater than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
      const order = ['home', 'learn', 'games', 'progress', 'profile'];
      const currentIdx = order.findIndex(id => id.toLowerCase() === this.activeTab().toLowerCase());

      if (diffX < 0) {
        // Swiped left -> Go to Next Tab
        if (currentIdx < order.length - 1) {
          this.selectTab(order[currentIdx + 1], undefined, 'slide-left');
        }
      } else {
        // Swiped right -> Go to Prev Tab
        if (currentIdx > 0) {
          this.selectTab(order[currentIdx - 1], undefined, 'slide-right');
        }
      }
    }
  }

  selectTab(tabId: string, event?: Event, animationDir?: string) {
    if (event) {
      event.preventDefault();
    }
    this.scrollToTop();
    const tab = this.tabs.find(t => t.id === tabId || t.id.toLowerCase() === tabId.toLowerCase());
    if (tab) {
      
      // Determine animation direction if not provided by swipe
      if (!animationDir) {
        const order = ['home', 'learn', 'games', 'progress', 'profile'];
        const currentIdx = order.findIndex(id => id.toLowerCase() === this.activeTab().toLowerCase());
        const targetIdx = order.findIndex(id => id.toLowerCase() === tab.id.toLowerCase());
        animationDir = targetIdx > currentIdx ? 'slide-left' : 'slide-right';
      }

      this.animationClass.set('');
      setTimeout(() => {
        this.animationClass.set(animationDir!);
        setTimeout(() => this.animationClass.set(''), 450);
      }, 10);

      this.activeTab.set(tab.id);
      this.router.navigateByUrl(tab.route, { replaceUrl: true });
    }
  }
}
