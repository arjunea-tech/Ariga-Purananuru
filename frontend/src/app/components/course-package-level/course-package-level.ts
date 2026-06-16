import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CoursePackageLevelService } from '../../services/course-package-level';
import { PackageService, PackageData } from '../../services/package';
import { LevelService, LevelData } from '../../services/level';
import { CourseService, CourseData } from '../../services/course';

@Component({
  selector: 'app-course-package-level',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './course-package-level.html',
  styleUrls: ['./course-package-level.css'],
})
export class CoursePackageLevel implements OnInit {
  private route = inject(ActivatedRoute);
  private packageService = inject(PackageService);
  private levelService = inject(LevelService);
  private courseService = inject(CourseService);
  private mappingService = inject(CoursePackageLevelService);

  packages = signal<PackageData[]>([]);
  courses = signal<CourseData[]>([]);
  allLevels = signal<LevelData[]>([]);
  selectedPackageId = signal<number | null>(null);
  selectedCourseId = signal<number | null>(null);
  mappedLevels = signal<any[]>([]);
  availableLevels = signal<LevelData[]>([]);
  sourceCourseId = signal<number | null>(null);
  selectedLevelIds = signal<number[]>([]);
  selectedCourseName = signal<string | null>(null);
  isDropdownOpen = signal(false);


  feedbackMessage = signal<{ type: 'success' | 'error', text: string } | null>(null);

  ngOnInit(): void {
    this.loadPackages();
    this.loadCourses();
  }

  loadPackages(): void {
    this.packageService.getAll().subscribe({
      next: (data) => this.packages.set(data),
      error: () => this.showFeedback('error', 'Failed to load packages'),
    });
  }

  loadCourses(): void {
    this.courseService.getAll().subscribe({
      next: (data) => {
        this.courses.set(data);
        const queryCId = this.route.snapshot.queryParamMap.get('course_id');
        if (queryCId) {
          const cId = Number(queryCId);
          this.selectedCourseId.set(cId);
          const course = data.find(c => c.id === cId);
          if (course) {
            this.selectedCourseName.set(course.name);
          }
          this.onSelectionChange();
        }
      },
      error: () => this.showFeedback('error', 'Failed to load courses'),
    });
  }

  onSelectionChange(): void {
    const pkgId = this.selectedPackageId();
    const courseId = this.selectedCourseId();
    if (pkgId && courseId) {
      if (!this.sourceCourseId()) {
        this.sourceCourseId.set(courseId);
      }
      this.loadMappings(pkgId, courseId);
    } else {
      this.mappedLevels.set([]);
      this.availableLevels.set([]);
    }
  }

  onSourceCourseChange(): void {
    const sourceId = this.sourceCourseId();
    const pkgId = this.selectedPackageId();
    const targetCourseId = this.selectedCourseId();

    if (sourceId && pkgId && targetCourseId) {
      this.loadMappings(pkgId, targetCourseId);
    }
  }

  loadMappings(packageId: number, courseId: number): void {
    this.mappingService.getByPackage(packageId, courseId).subscribe({
      next: (mapped) => {
        this.mappedLevels.set(mapped);
        this.loadLevelsByCourse(this.sourceCourseId() || courseId, mapped);
      },
      error: () => this.showFeedback('error', 'Failed to load level mappings'),
    });
  }

  loadLevelsByCourse(courseId: number, mapped: any[]): void {
    this.levelService.getAll(courseId).subscribe({
      next: (data) => {
        this.filterAvailableLevels(data, mapped);
      },
      error: () => this.showFeedback('error', 'Failed to load levels for course'),
    });
  }

  filterAvailableLevels(allLevels: LevelData[], mapped: any[]): void {
    const mappedIds = mapped.map(m => m.id);
    this.availableLevels.set(
      allLevels.filter(level => !mappedIds.includes(level.id))
    );
  }

  mapLevel(levelId: number): void {
    const pkgId = this.selectedPackageId();
    const courseId = this.selectedCourseId();
    if (pkgId && courseId) {
      this.mappingService.mapLevels(pkgId, courseId, [levelId]).subscribe({
        next: () => {
          this.showFeedback('success', 'Level mapped successfully');
          this.loadMappings(pkgId, courseId);
        },
        error: () => this.showFeedback('error', 'Failed to map level'),
      });
    }
  }

  mapSelectedLevels(): void {
    const pkgId = this.selectedPackageId();
    const courseId = this.selectedCourseId();
    const levelIds = this.selectedLevelIds();
    if (pkgId && courseId && levelIds.length > 0) {
      this.mappingService.mapLevels(pkgId, courseId, levelIds).subscribe({
        next: () => {
          this.showFeedback('success', `${levelIds.length} levels mapped successfully`);
          this.selectedLevelIds.set([]);
          this.loadMappings(pkgId, courseId);
        },
        error: () => this.showFeedback('error', 'Failed to map selected levels'),
      });
    }
  }

  unmapLevel(levelId: number): void {
    const pkgId = this.selectedPackageId();
    const courseId = this.selectedCourseId();
    if (pkgId && courseId && confirm('Are you sure you want to remove this level?')) {
      this.mappingService.unmap(pkgId, levelId).subscribe({
        next: () => {
          this.showFeedback('success', 'Level mapping removed');
          this.loadMappings(pkgId, courseId);
        },
        error: () => this.showFeedback('error', 'Failed to remove mapping'),
      });
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen.update(v => !v);
  }

  isLevelSelected(id: number): boolean {
    return this.selectedLevelIds().includes(id);
  }

  toggleLevelSelection(id: number): void {
    this.selectedLevelIds.update(ids => {
      if (ids.includes(id)) {
        return ids.filter(i => i !== id);
      } else {
        return [...ids, id];
      }
    });
  }

  getSelectedLevelsLabel(): string {
    const count = this.selectedLevelIds().length;
    if (count === 0) return 'Select Levels';
    if (count === 1) {
      const level = this.availableLevels().find(l => l.id === this.selectedLevelIds()[0]);
      return level ? level.name : '1 level selected';
    }
    return `${count} levels selected`;
  }


  private showFeedback(type: 'success' | 'error', text: string): void {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => this.feedbackMessage.set(null), 5000);
  }
}
