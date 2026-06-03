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
}
