import { Routes } from '@angular/router';
import { Package } from './components/package/package';
import { Tenant } from './components/tenant/tenant';
import { Property } from './components/property/property';
import { Course } from './components/course/course';
import { Level } from './components/level/level';
import { CoursePackageLevel } from './components/course-package-level/course-package-level';
import { Chapter } from './components/chapter/chapter';
import { Content } from './components/content/content';
import { Assessment } from './components/assessment/assessment';

import { LearningMode } from './components/learning-mode/learning-mode';
import { CoursePlayer } from './components/course-player/course-player';
import { AssessmentPlayerComponent } from './components/activity-engine/assessment-player';

export const routes: Routes = [
  { path: '', redirectTo: 'tenants', pathMatch: 'full' },
  { path: 'packages', component: Package },
  { path: 'tenants', component: Tenant },
  { path: 'properties', component: Property },
  { path: 'courses', component: Course },
  { path: 'levels', component: Level },
  { path: 'course-package-levels', component: CoursePackageLevel },
  { path: 'chapters', component: Chapter },
  { path: 'contents', component: Content },
  { path: 'assessments', component: Assessment },
  { path: 'assessments/play/:assessmentId', component: AssessmentPlayerComponent },
  { path: 'learning-modes', component: LearningMode },
  { path: 'learn', component: CoursePlayer }, // For query params: ?id=5
  { path: 'learn/:courseId', component: CoursePlayer }, // For path params: /learn/5
];