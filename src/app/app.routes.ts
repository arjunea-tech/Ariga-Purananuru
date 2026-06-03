import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
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
import { AssessmentPlayerComponent } from './components/activity-engine/assessment-player/assessment-player';
import { StudentManagement } from './components/student-management/student-management';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // Public Login route
  { path: 'login', component: LoginComponent },
  
  // Safe Fallback redirect
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  /*
   * 👑 Super Admin Only Pages
   */
  { 
    path: 'packages', 
    component: Package, 
    canActivate: [roleGuard(['super_admin'])] 
  },
  { 
    path: 'tenants', 
    component: Tenant, 
    canActivate: [roleGuard(['super_admin'])] 
  },

  /*
   * 🏢 Admins (Super Admin and Tenant Admin) Pages
   */
  { 
    path: 'properties', 
    component: Property, 
    canActivate: [roleGuard(['super_admin', 'tenant_admin'])] 
  },

  /*
   * 🏫 Staff (Super Admin, Tenant Admin, Property Manager) Pages
   */
  { 
    path: 'courses', 
    component: Course, 
    canActivate: [roleGuard(['super_admin', 'tenant_admin', 'property_manager'])] 
  },
  { 
    path: 'students', 
    component: StudentManagement, 
    canActivate: [roleGuard(['super_admin', 'tenant_admin', 'property_manager'])] 
  },
  { 
    path: 'levels', 
    component: Level, 
    canActivate: [roleGuard(['super_admin', 'tenant_admin', 'property_manager'])] 
  },
  { 
    path: 'course-package-levels', 
    component: CoursePackageLevel, 
    canActivate: [roleGuard(['super_admin', 'tenant_admin', 'property_manager'])] 
  },
  { 
    path: 'chapters', 
    component: Chapter, 
    canActivate: [roleGuard(['super_admin', 'tenant_admin', 'property_manager'])] 
  },
  { 
    path: 'contents', 
    component: Content, 
    canActivate: [roleGuard(['super_admin', 'tenant_admin', 'property_manager'])] 
  },
  { 
    path: 'assessments', 
    component: Assessment, 
    canActivate: [roleGuard(['super_admin', 'tenant_admin', 'property_manager'])] 
  },
  { 
    path: 'learning-modes', 
    component: LearningMode, 
    canActivate: [roleGuard(['super_admin', 'tenant_admin', 'property_manager'])] 
  },

  /*
   * 🎓 Learning Workspace (Accessible by Students and Staff)
   */
  { 
    path: 'learn', 
    component: CoursePlayer, 
    canActivate: [roleGuard(['student', 'super_admin', 'tenant_admin', 'property_manager'])] 
  },
  { 
    path: 'learn/:courseId', 
    component: CoursePlayer, 
    canActivate: [roleGuard(['student', 'super_admin', 'tenant_admin', 'property_manager'])] 
  },
  { 
    path: 'assessments/play/:assessmentId', 
    component: AssessmentPlayerComponent, 
    canActivate: [roleGuard(['student', 'super_admin', 'tenant_admin', 'property_manager'])] 
  },

  // Fallback for unauthorized pages
  { path: 'unauthorized', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];