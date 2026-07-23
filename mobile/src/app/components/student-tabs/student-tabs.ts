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
    { id: 'home', label: 'Home', icon: 'bi-house-door-fill', route: '/tabs/home', color: '#6C5CE7' },
    { id: 'learn', label: 'Learn', icon: 'bi-book-half', route: '/tabs/learn', color: '#00B894' },
    { id: 'Practice', label: 'Practice', icon: 'bi-controller', route: '/tabs/games', color: '#E17055' },
    { id: 'progress', label: 'Progress', icon: 'bi-bar-chart-line-fill', route: '/tabs/progress', color: '#0984E3' },
    { id: 'profile', label: 'Profile', icon: 'bi-person-circle', route: '/tabs/profile', color: '#FD79A8' }
  ];

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      if (url.includes('/learn')) this.activeTab.set('learn');
      else if (url.includes('/games')) this.activeTab.set('games');
      else if (url.includes('/progress')) this.activeTab.set('progress');
      else if (url.includes('/profile')) this.activeTab.set('profile');
      else this.activeTab.set('home');
    });
  }

  selectTab(tabId: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    const tab = this.tabs.find(t => t.id === tabId || t.id.toLowerCase() === tabId.toLowerCase());
    if (tab) {
      this.activeTab.set(tab.id);
      this.router.navigateByUrl(tab.route, { replaceUrl: true });
    }
  }
}
