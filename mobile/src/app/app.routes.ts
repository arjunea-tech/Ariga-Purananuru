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
import { LearnerDashboard } from './components/learner-dashboard/learner-dashboard';
import { AssessmentPlayerComponent } from './components/activity-engine/assessment-player/assessment-player';
import { UserManagement } from './components/user-management/user-management';
import { StudentProgressComponent } from './components/student-progress/student-progress';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { Announcements } from './components/announcements/announcements';
import { roleGuard } from './guards/role.guard';
import { guestGuard } from './guards/guest.guard';
import { platformGuard } from './guards/platform.guard';
import { AdminUploadComponent } from './components/admin-upload/admin-upload.component';
import { ActivityBuilder } from './components/activity-builder/activity-builder';
import { PracticeEngineComponent } from './components/practice-engine/practice-engine.component';
import { StudentTabsComponent } from './components/student-tabs/student-tabs';
import { LearnModulesComponent } from './components/learn-modules/learn-modules';
import { GamesHubComponent } from './components/games-hub/games-hub';
import { StudentProfileComponent } from './components/student-profile/student-profile';
import { KidsDashboard } from './components/kids-dashboard/kids-dashboard';
import { WelcomeScreen } from './components/welcome-screen/welcome-screen';


export const routes: Routes = [
  // 🌐 Public Landing Page (Root) - Landing Page on Web, Redirect to Login on Mobile App
  { path: '', component: WelcomeScreen, pathMatch: 'full', canActivate: [platformGuard] },

  // Public Login route
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'admin/login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'superadmin/login', component: LoginComponent, canActivate: [guestGuard] },

  { path: 'superadmin', redirectTo: 'superadmin/login', pathMatch: 'full' },
  { path: 'admin', redirectTo: 'admin/login', pathMatch: 'full' },

  // Public Signup route
  { path: 'signup', loadComponent: () => import('./components/signup/signup').then(m => m.SignupComponent), canActivate: [guestGuard] },

  // Public Store Landing Page
  { path: 'public-store', loadComponent: () => import('./components/store/store').then(m => m.StoreComponent) },

  // Public App Download Screen (Success registration on Web)
  { path: 'download-app', loadComponent: () => import('./components/download-app/download-app').then(m => m.DownloadAppComponent) },

  // Public Course Details
  { path: 'public-course-details/:id', loadComponent: () => import('./components/course-details/course-details').then(m => m.CourseDetails) },



  // 📱 Mobile Native 5-Tab Navigation Shell
  {
    path: 'tabs',
    component: StudentTabsComponent,
    canActivate: [roleGuard(['student', 'super_admin', 'admin', 'staff'])],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: KidsDashboard },
      { path: 'learn', component: LearnModulesComponent },
      { path: 'games', component: GamesHubComponent },
      { path: 'progress', component: StudentProgressComponent },
      { path: 'store', loadComponent: () => import('./components/store/store').then(m => m.StoreComponent) },
      { path: 'profile', component: StudentProfileComponent }
    ]
  },


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
  {
    path: 'admin-upload',
    component: AdminUploadComponent,
    canActivate: [roleGuard(['super_admin'])]
  },

  /*
   * 🏢 Admins (Super Admin and Tenant Admin) Pages
   */
  {
    path: 'properties',
    component: Property,
    canActivate: [roleGuard(['super_admin', 'admin'])]
  },

  /*
   * 🏫 Staff (Super Admin, Admin, Staff) Pages
   */
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff'])]
  },
  {
    path: 'announcements',
    component: Announcements,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff', 'student'])]
  },
  {
    path: 'courses',
    component: Course,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff'])]
  },
  {
    path: 'users',
    component: UserManagement,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff'])]
  },
  {
    path: 'student-progress',
    component: StudentProgressComponent,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff'])]
  },
  {
    path: 'levels',
    component: Level,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff'])]
  },
  {
    path: 'course-package-levels',
    component: CoursePackageLevel,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff'])]
  },
  {
    path: 'chapters',
    component: Chapter,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff'])]
  },
  {
    path: 'contents',
    component: Content,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff'])]
  },
  {
    path: 'assessments',
    component: Assessment,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff'])]
  },
  {
    path: 'learning-modes',
    component: LearningMode,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff'])]
  },
  {
    path: 'activity-builder',
    component: ActivityBuilder,
    canActivate: [roleGuard(['super_admin', 'admin', 'staff'])]
  },

  /*
   * 🎓 Learning Workspace (Accessible by Students and Staff)
   */
  {
    path: 'learn',
    redirectTo: 'tabs/home',
    pathMatch: 'full'
  },
  {
    path: 'learn/dashboard',
    component: LearnerDashboard,
    canActivate: [roleGuard(['student', 'super_admin', 'admin', 'staff'])]
  },
  {
    path: 'learn/courses',
    component: CoursePlayer,
    canActivate: [roleGuard(['student', 'super_admin', 'admin', 'staff'])]
  },
  {
    path: 'learn/achievements',
    component: CoursePlayer,
    canActivate: [roleGuard(['student', 'super_admin', 'admin', 'staff'])]
  },
  {
    path: 'learn/progress',
    component: CoursePlayer,
    canActivate: [roleGuard(['student', 'super_admin', 'admin', 'staff'])]
  },
  {
    path: 'learn/settings',
    component: CoursePlayer,
    canActivate: [roleGuard(['student', 'super_admin', 'admin', 'staff'])]
  },
  {
    path: 'learn/play/:courseId',
    component: CoursePlayer,
    canActivate: [roleGuard(['student', 'super_admin', 'admin', 'staff'])]
  },
  {
    path: 'learn/practice',
    component: PracticeEngineComponent,
    canActivate: [roleGuard(['student', 'super_admin', 'admin', 'staff'])]
  },
  {
    path: 'learn/:courseId',
    component: CoursePlayer,
    canActivate: [roleGuard(['student', 'super_admin', 'admin', 'staff'])]
  },
  {
    path: 'assessments/play/:assessmentId',
    component: AssessmentPlayerComponent,
    canActivate: [roleGuard(['student', 'super_admin', 'admin', 'staff'])]
  },

  // Fallback for unauthorized pages
  { path: 'unauthorized', redirectTo: '' },
  { path: '**', redirectTo: '' }
];
