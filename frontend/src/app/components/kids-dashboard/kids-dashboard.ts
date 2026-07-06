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
          // Manually calculate scroll target to prevent scrolling overflow:hidden parent
          const containerRect = mapContainer.getBoundingClientRect();
          const nodeRect = activeNode.getBoundingClientRect();
          const scrollTarget = mapContainer.scrollTop + (nodeRect.top - containerRect.top) - (containerRect.height / 2) + (nodeRect.height / 2);
          
          mapContainer.scrollTo({ top: scrollTarget, behavior: 'smooth' });
        } else {
          // If all completed, scroll to top (last chapter is at top)
          mapContainer.scrollTop = 0;
        }
      }
    }, 100);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (this.currentView !== 'map') return; // Only animate heavily if they are on the map

    const x = (e.clientX / window.innerWidth - 0.5) * 2; // Range -1 to 1
    const y = (e.clientY / window.innerHeight - 0.5) * 2; // Range -1 to 1

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

    // Pattern for xOffset to make nodes snake left and right
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

  // Dynamically generate the SVG path string connecting the nodes
  // Based on a fixed vertical spacing of 160px between nodes
  svgPathData = computed(() => {
    const level = this.selectedLevel();
    if (!level || level.chapters.length === 0) return '';
    
    const map = this.levelChaptersMap();
    const stepHeight = 160; 
    let d = '';
    
    level.chapters.forEach((chapter: any, idx: number) => {
      const info = map.get(chapter.id);
      if (!info) return;
      
      const x = 200 + info.xOffset; // 200 is horizontal center of SVG
      const y = (level.chapters.length - 1 - idx) * stepHeight + 80; // 80 is vertical offset
      
      if (idx === 0) {
        d += `M ${x} ${y} `;
      } else {
        const prevInfo = map.get(level.chapters[idx - 1].id);
        const prevX = 200 + (prevInfo ? prevInfo.xOffset : 0);
        const prevY = (level.chapters.length - idx) * stepHeight + 80;
        
        // Control points for a smooth bezier curve
        const cp1x = prevX;
        const cp1y = prevY - (stepHeight / 2);
        const cp2x = x;
        const cp2y = y + (stepHeight / 2);
        
        d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y} `;
      }
    });
    
    return d;
  });

  // Mock function to generate 1-3 stars for completed chapters
  getChapterStars(chapterId: number): number {
    if (!this.isChapterCompleted(chapterId)) return 0;
    // Generate a pseudo-random 1-3 stars based on chapterId so it's consistent
    return (chapterId % 3) + 1; 
  }

  isLevelUnlocked(levelId: number): boolean {
    return true;
  }

  // Calculate which chapter should be the glowing "active" one (the next to play)
  currentPlayableChapterId = computed(() => {
    const level = this.selectedLevel();
    if (!level) return null;
    
    // Find first uncompleted chapter
    const uncompleted = level.chapters.find((c: any) => !this.isChapterCompleted(c.id));
    if (uncompleted) return uncompleted.id;
    
    // If all completed, return the last chapter
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
