<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Chapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Fetch student dashboard analytics and gamified badges.
     */
    public function getStudentStats(Request $request)
    {
        $user = $request->user();
        $userId = $user->id;

        // 1. Overall Completion Progress
        // Get total chapters in current active tenant context (thanks to BelongsToTenant scope if applicable)
        $totalChapters = DB::table('chapters')->count();
        
        $completedChapters = DB::table('user_course_progress')
            ->where('user_id', $userId)
            ->where('status', 'completed')
            ->whereNotNull('chapter_id')
            ->distinct('chapter_id')
            ->count('chapter_id');

        $completionPercentage = $totalChapters > 0 
            ? round(($completedChapters / $totalChapters) * 100, 1) 
            : 0;

        // 2. Assessment stats
        $totalAttempts = DB::table('user_assessment_attempts')
            ->where('user_id', $userId)
            ->count();

        $passedAttempts = DB::table('user_assessment_attempts')
            ->where('user_id', $userId)
            ->where('passed', true)
            ->count();

        $averageScore = DB::table('user_assessment_attempts')
            ->where('user_id', $userId)
            ->avg('score');

        $averageScore = $averageScore ? round($averageScore, 1) : 0;

        // 3. Dynamic Badges Check
        $badges = [
            [
                'id' => 'first_step',
                'title' => 'First Step',
                'description' => 'Completed your first lesson topic',
                'icon' => '🚀',
                'unlocked' => $completedChapters >= 1,
            ],
            [
                'id' => 'bookworm',
                'title' => 'Bookworm',
                'description' => 'Read and finished 5+ lesson topics',
                'icon' => '📚',
                'unlocked' => $completedChapters >= 5,
            ],
            [
                'id' => 'scholar',
                'title' => 'Scholar',
                'description' => 'Scored a perfect 100% on any chapter test',
                'icon' => '🎓',
                'unlocked' => DB::table('user_assessment_attempts')
                    ->where('user_id', $userId)
                    ->where('score', 100)
                    ->exists(),
            ],
            [
                'id' => 'chapter_champ',
                'title' => 'Chapter Champion',
                'description' => 'Passed 3 or more assessments',
                'icon' => '🏆',
                'unlocked' => $passedAttempts >= 3,
            ],
            [
                'id' => 'graduation',
                'title' => 'Ultimate Graduation',
                'description' => 'Achieved 100% syllabus completion',
                'icon' => '👑',
                'unlocked' => $completionPercentage >= 100 && $totalChapters > 0,
            ],
        ];

        $completedChapterIds = DB::table('user_course_progress')
            ->where('user_id', $userId)
            ->where('status', 'completed')
            ->whereNotNull('chapter_id')
            ->pluck('chapter_id')
            ->toArray();

        return response()->json([
            'completion_percentage' => $completionPercentage,
            'completed_chapters' => $completedChapters,
            'total_chapters' => $totalChapters,
            'total_attempts' => $totalAttempts,
            'passed_attempts' => $passedAttempts,
            'average_score' => $averageScore,
            'badges' => $badges,
            'completed_chapter_ids' => $completedChapterIds,
        ]);
    }

    /**
     * Fetch student progress analytics for Staff/Admin tracking.
     */
    public function getStudentStatsForStaff(Request $request, $userId)
    {
        $currentUser = $request->user();
        
        // Security check: Must be staff, and if not super_admin, must match tenant_id
        if ($currentUser->role !== 'super_admin') {
            $targetUser = User::find($userId);
            if (!$targetUser || $targetUser->tenant_id !== $currentUser->tenant_id) {
                return response()->json(['error' => 'Unauthorized or User not found.'], 403);
            }
        }

        // Overall Completion Progress
        $totalChapters = DB::table('chapters')->count();
        
        $completedChapters = DB::table('user_course_progress')
            ->where('user_id', $userId)
            ->where('status', 'completed')
            ->whereNotNull('chapter_id')
            ->distinct('chapter_id')
            ->count('chapter_id');

        $completionPercentage = $totalChapters > 0 
            ? round(($completedChapters / $totalChapters) * 100, 1) 
            : 0;

        // Assessment stats
        $passedAttempts = DB::table('user_assessment_attempts')
            ->where('user_id', $userId)
            ->where('passed', true)
            ->count();

        $averageScore = DB::table('user_assessment_attempts')
            ->where('user_id', $userId)
            ->avg('score');
        $averageScore = $averageScore ? round($averageScore, 1) : 0;

        // Course breakdown (Show all courses in system and calculate student progress)
        $coursesProgress = [];
        $courses = \App\Models\Course::where('is_active', true)->get();
        
        foreach ($courses as $course) {
            $totalCourseChapters = DB::table('chapters')
                ->join('level_chapter', 'chapters.id', '=', 'level_chapter.chapter_id')
                ->join('levels', 'level_chapter.level_id', '=', 'levels.id')
                ->join('course_package_levels', 'levels.id', '=', 'course_package_levels.level_id')
                ->where('course_package_levels.course_id', $course->id)
                ->count('chapters.id');
                
            $completedCourseChapters = DB::table('user_course_progress')
                ->where('user_id', $userId)
                ->where('status', 'completed')
                ->whereIn('chapter_id', function ($query) use ($course) {
                    $query->select('chapters.id')
                        ->from('chapters')
                        ->join('level_chapter', 'chapters.id', '=', 'level_chapter.chapter_id')
                        ->join('levels', 'level_chapter.level_id', '=', 'levels.id')
                        ->join('course_package_levels', 'levels.id', '=', 'course_package_levels.level_id')
                        ->where('course_package_levels.course_id', $course->id);
                })
                ->distinct('chapter_id')
                ->count('chapter_id');
                
            if ($totalCourseChapters > 0 || $completedCourseChapters > 0) {
                $coursesProgress[] = [
                    'course_name' => $course->name,
                    'total_chapters' => $totalCourseChapters,
                    'completed_chapters' => $completedCourseChapters,
                    'percentage' => $totalCourseChapters > 0 ? round(($completedCourseChapters / $totalCourseChapters) * 100, 1) : 0,
                ];
            }
        }

        return response()->json([
            'completion_percentage' => $completionPercentage,
            'completed_chapters' => $completedChapters,
            'total_chapters' => $totalChapters,
            'passed_attempts' => $passedAttempts,
            'average_score' => $averageScore,
            'total_courses' => count($coursesProgress),
            'courses_progress' => $coursesProgress,
        ]);
    }

    /**
     * Fetch global school/tenant statistics for Admins
     */
    public function getTenantStats(Request $request)
    {
        $currentUser = $request->user();
        $tenantId = $currentUser->tenant_id;

        // Base user query based on role
        $usersQuery = User::query();
        if ($currentUser->role !== 'super_admin') {
            $usersQuery->where('tenant_id', $tenantId);
        }

        $totalStudents = (clone $usersQuery)->where('role', 'student')->count();
        $totalStaff = (clone $usersQuery)->where('role', 'staff')->count();

        // Count active courses (for simplicity, we count all active courses in the system, or we could filter by tenant's packages)
        // Here we just count all active courses if they use a global catalog, or filter by tenant if they use mapping
        if ($currentUser->role === 'super_admin') {
            $activeCourses = \App\Models\Course::where('is_active', true)->count();
        } else {
            // A tenant only has access to courses mapped to its properties
            $activeCourses = DB::table('property_packages')
                ->join('properties', 'property_packages.property_id', '=', 'properties.id')
                ->where('properties.tenant_id', $tenantId)
                ->where('property_packages.is_active', true)
                ->whereNotNull('property_packages.course_id')
                ->distinct('property_packages.course_id')
                ->count('property_packages.course_id');
        }

        // Overall completion rate for the school
        // Calculate average completion of all students in the tenant
        $studentIds = (clone $usersQuery)->where('role', 'student')->pluck('id');
        
        $totalChapters = DB::table('chapters')->count();
        
        $overallCompletionPercentage = 0;
        if ($studentIds->count() > 0 && $totalChapters > 0) {
            $completedChapters = DB::table('user_course_progress')
                ->whereIn('user_id', $studentIds)
                ->where('status', 'completed')
                ->whereNotNull('chapter_id')
                ->count();
                
            $maxPossibleCompletions = $studentIds->count() * $totalChapters;
            $overallCompletionPercentage = round(($completedChapters / $maxPossibleCompletions) * 100, 1);
        }

        return response()->json([
            'total_students' => $totalStudents,
            'total_staff' => $totalStaff,
            'active_courses' => $activeCourses,
            'overall_completion_rate' => $overallCompletionPercentage,
        ]);
    }
}
