<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\LevelController;
use App\Http\Controllers\ChapterController;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\LearningProgressController;
use App\Http\Controllers\LearningModeController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AITutorController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\PracticeWordController;
use App\Http\Controllers\YappuSeerWordController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});
Route::get('/tenants/brand/{code}', [TenantController::class, 'getBranding']);
Route::get('/practice-words', [PracticeWordController::class, 'index']);
Route::get('/practice-words/random', [PracticeWordController::class, 'getRandom']);
Route::get('/yappu-seer-words', [YappuSeerWordController::class, 'index']);

// Public Courses & Store
Route::get('courses', [CourseController::class, 'index']);
Route::get('courses/{course}', [CourseController::class, 'show']);
Route::get('store/courses', [CourseController::class, 'getStorefront']);
Route::get('courses/{course}/player-structure', [CourseController::class, 'getPlayerStructure']);
Route::get('attachments/{id}/download', [ContentController::class, 'downloadAttachment']);

Route::get('/test-db', function() {
    return [
        'connection' => config('database.default'),
        'database' => config('database.connections.' . config('database.default')),
        'courses_count' => \App\Models\Course::count(),
        'courses' => \App\Models\Course::all(),
    ];
});


/*
|--------------------------------------------------------------------------
| Protected & Tenant-Scoped Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'identify.tenant'])->group(function () {
    
    // Auth profile endpoints
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Common Routes
    Route::get('dashboard/tenant-stats', [DashboardController::class, 'getTenantStats']);
    Route::get('announcements', [AnnouncementController::class, 'index']);

    // Admin/Staff Routes for Announcements
    Route::middleware(['role:super_admin,admin,staff'])->group(function () {
        Route::post('announcements', [AnnouncementController::class, 'store']);
        Route::put('announcements/{announcement}', [AnnouncementController::class, 'update']);
        Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy']);
    });

    /*
     * 👑 Super Admin Only Modifiers
     */
    Route::middleware(['role:super_admin'])->group(function () {
        Route::post('tenants', [TenantController::class, 'store']);
        Route::put('tenants/{tenant}', [TenantController::class, 'update']);
        Route::delete('tenants/{tenant}', [TenantController::class, 'destroy']);

        Route::post('packages', [PackageController::class, 'store']);
        Route::put('packages/{package}', [PackageController::class, 'update']);
        Route::delete('packages/{package}', [PackageController::class, 'destroy']);
    });

    /*
     * 🏢 Tenant Admin and Super Admin Resources
     */
    Route::middleware(['role:super_admin,admin,tenant_admin'])->group(function () {
        Route::get('tenants', [TenantController::class, 'index']);
        Route::get('tenants/{tenant}', [TenantController::class, 'show']);
        Route::put('tenants/{tenant}/branding', [TenantController::class, 'updateBranding']);

        Route::get('packages', [PackageController::class, 'index']);
        Route::get('packages/{package}', [PackageController::class, 'show']);

        Route::apiResource('properties', PropertyController::class);
        
        // Course-Package-Level mapping (Consolidated in PackageController)
        Route::post('packages/{packageId}/levels', [PackageController::class, 'mapLevels']);
        Route::delete('packages/{packageId}/levels/{levelId}', [PackageController::class, 'unmapLevel']);
    });

    /*
     * 🏫 Staff (Super Admin, Admin, Staff) Resources
     */
    Route::middleware(['role:super_admin,admin,staff'])->group(function () {
        Route::post('courses', [CourseController::class, 'store']);
        Route::post('courses/upload-cover', [CourseController::class, 'uploadCoverImage']);
        Route::put('courses/{course}', [CourseController::class, 'update']);
        Route::delete('courses/{course}', [CourseController::class, 'destroy']);
        Route::post('users/import', [AuthController::class, 'batchImport']);
        Route::get('users', [AuthController::class, 'getUsers']);
        Route::put('users/{user}', [AuthController::class, 'updateUser']);
        Route::delete('users/{user}', [AuthController::class, 'destroyUser']);
        Route::get('users/{userId}/progress-stats', [DashboardController::class, 'getStudentStatsForStaff']);
        Route::get('dashboard/tenant-stats', [DashboardController::class, 'getTenantStats']);
        
        Route::post('levels', [LevelController::class, 'store']);
        Route::put('levels/{level}', [LevelController::class, 'update']);
        Route::delete('levels/{level}', [LevelController::class, 'destroy']);

        Route::post('chapters', [ChapterController::class, 'store']);
        Route::put('chapters/{chapter}', [ChapterController::class, 'update']);
        Route::delete('chapters/{chapter}', [ChapterController::class, 'destroy']);

        Route::post('contents', [ContentController::class, 'store']);
        Route::put('contents/{content}', [ContentController::class, 'update']);
        Route::delete('contents/{content}', [ContentController::class, 'destroy']);
        Route::post('contents/upload', [ContentController::class, 'upload']);

        Route::post('assessments', [AssessmentController::class, 'store']);
        Route::put('assessments/{assessment}', [AssessmentController::class, 'update']);
        Route::delete('assessments/{assessment}', [AssessmentController::class, 'destroy']);

        Route::post('learning-modes', [LearningModeController::class, 'store']);
        Route::put('learning-modes/{learning_mode}', [LearningModeController::class, 'update']);
        Route::delete('learning-modes/{learning_mode}', [LearningModeController::class, 'destroy']);

        Route::post('activities', [App\Http\Controllers\ActivityController::class, 'store']);
        Route::put('activities/{activity}', [App\Http\Controllers\ActivityController::class, 'update']);
        Route::delete('activities/{activity}', [App\Http\Controllers\ActivityController::class, 'destroy']);

        // Level-Chapter mapping (Consolidated in LevelController)
        Route::post('levels/{levelId}/chapters', [LevelController::class, 'mapChapters']);
        Route::delete('levels/{levelId}/chapters/{chapterId}', [LevelController::class, 'unmapChapter']);
        Route::post('levels/{levelId}/chapters/reorder', [LevelController::class, 'reorderChapters']);

        // Chapter-Level mapping (Consolidated in ChapterController)
        Route::post('chapters/{chapterId}/levels', [ChapterController::class, 'mapLevels']);
    });

    /*
     * 🎓 Shared/Student Access Resources
     */
    // Course player structure is read-only for players
    Route::get('courses', [CourseController::class, 'index']);
    Route::get('courses/{course}', [CourseController::class, 'show']);

    // B2C Payments
    Route::post('payment/order', [\App\Http\Controllers\PaymentController::class, 'createOrder']);
    Route::post('payment/verify', [\App\Http\Controllers\PaymentController::class, 'verifyPayment']);

    Route::get('levels', [LevelController::class, 'index']);
    Route::get('levels/{level}', [LevelController::class, 'show']);
    Route::get('levels/{levelId}/chapters', [LevelController::class, 'getChapters']);

    Route::get('chapters', [ChapterController::class, 'index']);
    Route::get('chapters/{chapter}', [ChapterController::class, 'show']);
    Route::get('chapters/{chapterId}/levels', [ChapterController::class, 'getLevels']);

    Route::get('contents', [ContentController::class, 'index']);
    Route::get('contents/{content}', [ContentController::class, 'show']);

    Route::get('assessments', [AssessmentController::class, 'index']);
    Route::get('assessments/{assessment}', [AssessmentController::class, 'show']);

    Route::get('learning-modes', [LearningModeController::class, 'index']);
    Route::get('learning-modes/{learning_mode}', [LearningModeController::class, 'show']);

    Route::get('activities', [App\Http\Controllers\ActivityController::class, 'index']);
    Route::get('activities/{activity}', [App\Http\Controllers\ActivityController::class, 'show']);

    Route::get('packages/{packageId}/levels', [PackageController::class, 'getLevels']);

    // Assessment submission
    Route::post('assessments/{assessmentId}/submit', [AssessmentController::class, 'submitAttempt']);

    // Student Dashboard stats
    Route::get('student/dashboard', [DashboardController::class, 'getStudentStats']);
    Route::post('student/reset-progress', [DashboardController::class, 'resetStudentProgress']);

    // Learning progress tracking
    Route::get('users/{userId}/courses/{courseId}/progress', [LearningProgressController::class, 'getUserProgress']);
    Route::get('users/{userId}/levels/{levelId}/access', [LearningProgressController::class, 'getLevelAccess']);
    Route::get('users/{userId}/levels/{levelId}/chapters/progress', [LearningProgressController::class, 'getChapterProgress']);
    Route::post('chapters/{chapterId}/complete', [LearningProgressController::class, 'completeChapter']);
    
    // AI Tutor
    Route::post('ai-tutor/chat', [AITutorController::class, 'chat']);
    Route::post('ai-tutor/generate-quiz', [AITutorController::class, 'generateQuiz']);

    // Profile Settings & dynamic updates
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Dynamic topic-specific learning activities
    Route::post('contents/{contentId}/activities', [AITutorController::class, 'generateActivities']);

    // Record student activity for XP & streak tracking
    Route::post('student/record-activity', [DashboardController::class, 'recordActivity']);

    // ── Support Tickets ────────────────────────────────────────────────────
    // Student: submit a ticket & view own tickets
    Route::post('support/tickets', [SupportTicketController::class, 'store']);
    Route::get('support/my-tickets', [SupportTicketController::class, 'myTickets']);

    // Admin/Staff/Super Admin: list all tickets & reply
    Route::middleware(['role:super_admin,admin,staff,tenant_admin'])->group(function () {
        Route::get('support/tickets', [SupportTicketController::class, 'index']);
        Route::post('support/tickets/{id}/reply', [SupportTicketController::class, 'reply']);
    });
});
