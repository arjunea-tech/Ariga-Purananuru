<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Level;
use App\Models\Chapter;
use App\Models\UserAssessmentAttempt;
use App\Services\ProgressService;
use Illuminate\Http\Request;

class LearningProgressController extends Controller
{
    protected $progressService;

    public function __construct(ProgressService $progressService)
    {
        $this->progressService = $progressService;
    }

    /**
     * Get user progress for all levels in a course.
     */
    public function getUserProgress($userId, $courseId)
    {
        // Existing logic for course level overview
        $course = Course::with(['levels' => function ($q) {
            $q->orderBy('sort_order');
        }])->findOrFail($courseId);

        $levels = [];
        $previousPassed = true;

        foreach ($course->levels as $level) {
            $unlocked = $previousPassed;
            // Check if user has passed ALL mandatory assessments for this level (if any)
            $isCompleted = $this->progressService->isChapterCompleted($userId, null); // level logic would be similar

            $levels[] = [
                'level_id' => $level->id,
                'name' => $level->name,
                'is_unlocked' => $unlocked,
                // simplified for summary
            ];
            
            // For now, let's stick to the existing logic but keep it extensible
            $previousPassed = true; // Temporary
        }

        return response()->json(['levels' => $levels]);
    }

    /**
     * Get unlocked status for all chapters in a level.
     */
    public function getChapterProgress($userId, $levelId)
    {
        $level = Level::findOrFail($levelId);
        $chapters = $level->chapters()
            ->orderBy('level_chapter.sort_order')
            ->get();

        if ($chapters->isEmpty()) {
            return response()->json(['chapters' => []]);
        }

        $chapterIds = $chapters->pluck('id')->toArray();

        // 1. Fetch all mandatory assessments for these chapters
        $mandatoryAssessments = \App\Models\Assessment::whereIn('chapter_id', $chapterIds)
            ->where('is_mandatory', true)
            ->get();
            
        // 2. Fetch all passed assessment attempts for the user in these chapters
        $mandatoryAssessmentIds = $mandatoryAssessments->pluck('id')->toArray();
        $passedAssessmentIds = [];
        if (!empty($mandatoryAssessmentIds)) {
            $passedAssessmentIds = \App\Models\UserAssessmentAttempt::where('user_id', $userId)
                ->whereIn('assessment_id', $mandatoryAssessmentIds)
                ->where('passed', true)
                ->pluck('assessment_id')
                ->toArray();
        }
        $passedAssessmentSet = array_flip($passedAssessmentIds);

        // Calculate which chapters are completed
        $completedChapterIds = [];
        foreach ($chapterIds as $cId) {
            $chapterAssessments = $mandatoryAssessments->where('chapter_id', $cId);
            $isCompleted = true;
            foreach ($chapterAssessments as $assessment) {
                if (!isset($passedAssessmentSet[$assessment->id])) {
                    $isCompleted = false;
                    break;
                }
            }
            if ($isCompleted) {
                $completedChapterIds[$cId] = true;
            }
        }

        // Learning Mode Check (from Service)
        $learningMode = $this->progressService->getUserLearningMode($userId);
        $isFreeStyle = ($learningMode === 'FREE_STYLE');

        $data = [];
        $previousCompleted = true;

        foreach ($chapters as $chapter) {
            $isCompleted = isset($completedChapterIds[$chapter->id]);
            $isUnlocked = $isFreeStyle || $previousCompleted;

            $data[] = [
                'chapter_id' => $chapter->id,
                'name' => $chapter->name,
                'is_unlocked' => $isUnlocked,
                'is_completed' => $isCompleted,
            ];

            // Strict mode logic: next chapter is unlocked only if this one is completed
            $previousCompleted = $isCompleted;
        }

        return response()->json(['chapters' => $data]);
    }

    /**
     * Check if a specific level is accessible to a user.
     */
    public function getLevelAccess($userId, $levelId)
    {
        // Keep existing or use service
        return response()->json(['is_unlocked' => true]);
    }

    /**
     * Mark a specific chapter as completed for the authenticated user.
     */
    public function completeChapter(Request $request, $chapterId)
    {
        $user = $request->user();
        $chapter = Chapter::findOrFail($chapterId);

        // Find level mapping
        $levelChapter = \DB::table('level_chapter')->where('chapter_id', $chapterId)->first();
        $levelId = $levelChapter ? $levelChapter->level_id : null;

        // Find course mapping
        $courseId = 0;
        if ($levelId) {
            $coursePackageLevel = \DB::table('course_package_levels')->where('level_id', $levelId)->first();
            $courseId = $coursePackageLevel ? $coursePackageLevel->course_id : 0;
        }

        $isNewCompletion = false;
        $progress = \App\Models\UserCourseProgress::where('user_id', $user->id)
            ->where('chapter_id', $chapterId)
            ->first();

        if (!$progress || $progress->status !== 'completed') {
            $isNewCompletion = true;
        }

        \App\Models\UserCourseProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'level_id' => $levelId,
                'chapter_id' => $chapterId,
            ],
            [
                'course_id' => $courseId,
                'status' => 'completed',
                'completed_at' => now(),
            ]
        );

        // Calculate Realistic Rewards
        $xpEarned = 0;
        $unlockedBadges = [];

        if ($isNewCompletion) {
            $xpEarned = 100; // Base XP for completing a chapter

            $completedChapters = \DB::table('user_course_progress')
                ->where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereNotNull('chapter_id')
                ->distinct('chapter_id')
                ->count('chapter_id');

            if ($completedChapters == 1) {
                $unlockedBadges[] = [
                    'id' => 'first_step',
                    'title' => 'First Step',
                    'icon' => '🚀'
                ];
            } else if ($completedChapters == 5) {
                $unlockedBadges[] = [
                    'id' => 'bookworm',
                    'title' => 'Bookworm',
                    'icon' => '📚'
                ];
            }
            
            // Note: If you want to check graduation, you can count total chapters in course, but for now we stick to absolute thresholds
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Chapter marked as completed successfully',
            'rewards' => [
                'xp_earned' => $xpEarned,
                'badges' => $unlockedBadges
            ]
        ]);
    }
}
