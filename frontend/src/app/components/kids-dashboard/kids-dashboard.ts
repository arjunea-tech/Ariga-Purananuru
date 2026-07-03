import { Component, Input, Output, EventEmitter, computed, HostListener, OnChanges, SimpleChanges, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

interface Level {
  id: number;
  name: string;
  chapters: any[];
}

interface CourseStructure {
  id: number;
  name: string;
  levels: Level[];
}

@Component({
  selector: 'app-kids-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kids-dashboard.html',
  styleUrls: ['./kids-dashboard.css']
})
export class KidsDashboard implements OnChanges, AfterViewInit {
  @Input() structure: CourseStructure | null = null;
  @Input() currentView: string = 'levels';
  @Input() activeLevelId: number | null = null;
  @Input() activeChapterId: number | null = null;
  @Input() completedLevels: number[] = [];
  @Input() completedChapters: number[] = [];

  @Output() selectLevel = new EventEmitter<number>();
  @Output() selectChapterNode = new EventEmitter<number>();

  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentView'] && changes['currentView'].currentValue === 'map') {
      this.scrollToActiveNode();
    }
  }

  ngAfterViewInit() {
    if (this.currentView === 'map') {
      this.scrollToActiveNode();
    }
  }

  scrollToActiveNode() {
    if (!this.isBrowser) return;
    setTimeout(() => {
      const mapContainer = document.querySelector('.map-container') as HTMLElement;
      const activeNode = document.querySelector('.active-node') as HTMLElement;
      
      if (mapContainer) {
        if (activeNode) {
          const containerRect = mapContainer.getBoundingClientRect();
          const nodeRect = activeNode.getBoundingClientRect();
          const scrollTarget = mapContainer.scrollTop + (nodeRect.top - containerRect.top) - (containerRect.height / 2) + (nodeRect.height / 2);
          
          mapContainer.scrollTo({ top: scrollTarget, behavior: 'smooth' });
        } else {
          mapContainer.scrollTop = 0;
        }
      }
    }, 100);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (this.currentView !== 'map') return;

    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    gsap.to('.hill-bg-1', { x: x * -10, y: y * -5, duration: 1, ease: 'power2.out' });
    gsap.to('.hill-bg-2', { x: x * -20, y: y * -10, duration: 1, ease: 'power2.out' });
    gsap.to('.hill-bg-3', { x: x * -35, y: y * -15, duration: 1, ease: 'power2.out' });
    gsap.to('.cloud-1, .cloud-2, .cloud-3', { x: x * 40, y: y * 20, duration: 2, ease: 'power1.out' });
    gsap.to('.sparkles-container', { x: x * -30, y: y * -30, duration: 1.5, ease: 'power1.out' });
  }

  selectedLevel = computed(() => {
    const struct = this.structure;
    const levId = this.activeLevelId;
    if (!struct || !levId) return null;
    return struct.levels.find((l: any) => l.id === levId) || null;
  });

  levelChaptersMap = computed(() => {
    const level = this.selectedLevel();
    const map = new Map<number, { globalNumber: number; globalIndex: number; xOffset: number }>();
    if (!level) return map;

    const pattern = [0, -60, -90, -40, 20, 80, 50, 0];
    level.chapters.forEach((chapter: any, idx: number) => {
      const xOffset = pattern[idx % pattern.length];
      map.set(chapter.id, {
        globalNumber: idx + 1,
        globalIndex: idx,
        xOffset
      });
    });

    return map;
  });

  svgPathData = computed(() => {
    const level = this.selectedLevel();
    if (!level || level.chapters.length === 0) return '';
    
    const map = this.levelChaptersMap();
    const stepHeight = 160; 
    let d = '';
    
    level.chapters.forEach((chapter: any, idx: number) => {
      const info = map.get(chapter.id);
      if (!info) return;
      
      const x = 200 + info.xOffset;
      const y = (level.chapters.length - 1 - idx) * stepHeight + 80;
      
      if (idx === 0) {
        d += `M ${x} ${y} `;
      } else {
        const prevInfo = map.get(level.chapters[idx - 1].id);
        const prevX = 200 + (prevInfo ? prevInfo.xOffset : 0);
        const prevY = (level.chapters.length - idx) * stepHeight + 80;
        
        const cp1x = prevX;
        const cp1y = prevY - (stepHeight / 2);
        const cp2x = x;
        const cp2y = y + (stepHeight / 2);
        
        d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y} `;
      }
    });
    
    return d;
  });

  getChapterStars(chapterId: number): number {
    if (!this.isChapterCompleted(chapterId)) return 0;
    return (chapterId % 3) + 1; 
  }

  isLevelUnlocked(levelId: number): boolean {
    return true;
  }

  currentPlayableChapterId = computed(() => {
    const level = this.selectedLevel();
    if (!level) return null;
    
    const uncompleted = level.chapters.find((c: any) => !this.isChapterCompleted(c.id));
    if (uncompleted) return uncompleted.id;
    
    return level.chapters.length > 0 ? level.chapters[level.chapters.length - 1].id : null;
  });

  isChapterUnlocked(chapterId: number): boolean {
    return true;
  }

  isChapterCompleted(chapterId: number): boolean {
    return this.completedChapters.includes(chapterId);
  }

  onLevelClick(id: number) {
    if (this.isLevelUnlocked(id)) {
      this.selectLevel.emit(id);
    }
  }

  onChapterClick(id: number) {
    if (this.isChapterUnlocked(id)) {
      this.selectChapterNode.emit(id);
    }
  }
}
