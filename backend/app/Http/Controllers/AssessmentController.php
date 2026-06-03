<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\QuestionOption;
use App\Models\UserAssessmentAttempt;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Assessment::with(['level', 'chapter', 'questions.options']);

        if ($request->has('level_id')) {
            $query->where('level_id', $request->level_id);
        }
        if ($request->has('chapter_id')) {
            $query->where('chapter_id', $request->chapter_id);
        }


        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'level_id' => 'nullable|exists:levels,id',
            'chapter_id' => 'nullable|exists:chapters,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'pass_percentage' => 'nullable|numeric|min:0|max:100',
            'is_mandatory' => 'boolean',
            'duration_minutes' => 'nullable|integer|min:0',
            'allow_restart' => 'boolean',
            'review_mode' => 'nullable|string|in:instantly,after_completion',
            'activity_type' => 'nullable|string|in:listen_audio,read_passage,watch_video,plain',
            'prelude_content' => 'nullable|string',
            'is_active' => 'boolean',
            'questions' => 'nullable|array',
            'questions.*.question_text' => 'required|string',
            'questions.*.question_type' => 'nullable|string',
            'questions.*.additional_data' => 'nullable|array',
            'questions.*.media_url' => 'nullable|string',
            'questions.*.sort_order' => 'nullable|integer',
            'questions.*.options' => 'nullable|array',
            'questions.*.options.*.option_text' => 'required|string|max:500',
            'questions.*.options.*.is_correct' => 'required|boolean',
            'questions.*.options.*.sort_order' => 'nullable|integer',
        ]);

        $assessment = Assessment::create($request->only([
            'level_id',
            'chapter_id',
            'title',
            'description',
            'pass_percentage',
            'is_mandatory',
            'duration_minutes',
            'allow_restart',
            'review_mode',
            'activity_type',
            'prelude_content',
            'is_active'
        ]));

        if (isset($validated['questions'])) {
            foreach ($validated['questions'] as $qIndex => $questionData) {
                $question = $assessment->questions()->create([
                    'question_text' => $questionData['question_text'],
                    'question_type' => $questionData['question_type'] ?? 'multiple_choice',
                    'additional_data' => $questionData['additional_data'] ?? null,
                    'media_url' => $questionData['media_url'] ?? null,
                    'sort_order' => $questionData['sort_order'] ?? $qIndex,
                ]);

                if (isset($questionData['options'])) {
                    foreach ($questionData['options'] as $oIndex => $optionData) {
                        $question->options()->create([
                            'option_text' => $optionData['option_text'],
                            'is_correct' => $optionData['is_correct'],
                            'sort_order' => $optionData['sort_order'] ?? $oIndex,
                        ]);
                    }
                }
            }
        }

        return response()->json($assessment->load(['level', 'chapter', 'questions.options']), 201);
    }

    public function show(Assessment $assessment)
    {
        return response()->json($assessment->load(['level', 'chapter', 'questions.options']));
    }

    public function update(Request $request, Assessment $assessment)
    {
        $validated = $request->validate([
            'level_id' => 'nullable|exists:levels,id',
            'chapter_id' => 'nullable|exists:chapters,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'pass_percentage' => 'nullable|numeric|min:0|max:100',
            'is_mandatory' => 'boolean',
            'duration_minutes' => 'nullable|integer|min:0',
            'allow_restart' => 'boolean',
            'review_mode' => 'nullable|string|in:instantly,after_completion',
            'activity_type' => 'nullable|string|in:listen_audio,read_passage,watch_video,plain',
            'prelude_content' => 'nullable|string',
            'is_active' => 'boolean',
            'questions' => 'nullable|array',
            'questions.*.question_text' => 'required|string',
            'questions.*.question_type' => 'nullable|string',
            'questions.*.additional_data' => 'nullable|array',
            'questions.*.media_url' => 'nullable|string',
            'questions.*.sort_order' => 'nullable|integer',
            'questions.*.options' => 'nullable|array',
            'questions.*.options.*.option_text' => 'required|string|max:500',
            'questions.*.options.*.is_correct' => 'required|boolean',
            'questions.*.options.*.sort_order' => 'nullable|integer',
        ]);

        $assessment->update($request->only([
            'level_id',
            'chapter_id',
            'title',
            'description',
            'pass_percentage',
            'is_mandatory',
            'duration_minutes',
            'allow_restart',
            'review_mode',
            'activity_type',
            'prelude_content',
            'is_active'
        ]));

        if (isset($validated['questions'])) {
            $assessment->questions()->delete();
            foreach ($validated['questions'] as $qIndex => $questionData) {
                $question = $assessment->questions()->create([
                    'question_text' => $questionData['question_text'],
                    'question_type' => $questionData['question_type'] ?? 'multiple_choice',
                    'additional_data' => $questionData['additional_data'] ?? null,
                    'media_url' => $questionData['media_url'] ?? null,
                    'sort_order' => $questionData['sort_order'] ?? $qIndex,
                ]);

                if (isset($questionData['options'])) {
                    foreach ($questionData['options'] as $oIndex => $optionData) {
                        $question->options()->create([
                            'option_text' => $optionData['option_text'],
                            'is_correct' => $optionData['is_correct'],
                            'sort_order' => $optionData['sort_order'] ?? $oIndex,
                        ]);
                    }
                }
            }
        }

        return response()->json($assessment->load(['level', 'chapter', 'questions.options']));
    }

    public function destroy(Assessment $assessment)
    {
        $assessment->delete();
        return response()->noContent();
    }

    /**
     * Submit assessment attempt — calculates score and records pass/fail.
     */
    public function submitAttempt(Request $request, $assessmentId)
    {
        $assessment = Assessment::with('questions.options')->findOrFail($assessmentId);

        $validated = $request->validate([
            'user_id' => 'required|integer',
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|integer',
            'answers.*.selected_option_id' => 'required|integer',
        ]);

        $totalQuestions = $assessment->questions->count();
        $correctAnswers = 0;

        foreach ($validated['answers'] as $answer) {
            $question = $assessment->questions->find($answer['question_id']);
            if ($question) {
                $correctOption = $question->options->where('is_correct', true)->first();
                if ($correctOption && $correctOption->id == $answer['selected_option_id']) {
                    $correctAnswers++;
                }
            }
        }

        $score = $totalQuestions > 0 ? round(($correctAnswers / $totalQuestions) * 100, 2) : 0;
        $passed = $score >= $assessment->pass_percentage;

        $attempt = UserAssessmentAttempt::create([
            'user_id' => $validated['user_id'],
            'assessment_id' => $assessment->id,
            'score' => $score,
            'passed' => $passed,
            'attempted_at' => now(),
        ]);

        // Update overall course progress if passed
        if ($passed) {
            \App\Models\UserCourseProgress::updateOrCreate(
                [
                    'user_id' => $validated['user_id'],
                    'level_id' => $assessment->level_id,
                    'chapter_id' => $assessment->chapter_id,
                ],
                [
                    'course_id' => $assessment->level?->course_id ?? 0, // Fallback
                    'status' => 'completed',
                    'score' => $score,
                    'completed_at' => now(),
                ]
            );
        }

        return response()->json([
            'attempt_id' => $attempt->id,
            'score' => $score,
            'passed' => $passed,
            'total_questions' => $totalQuestions,
            'correct_answers' => $correctAnswers,
            'pass_percentage' => $assessment->pass_percentage,
        ]);
    }
}
