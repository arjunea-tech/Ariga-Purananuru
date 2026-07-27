<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user && $user->role === 'student' && $user->tenant_id) {
            $today = now()->toDateString();
            $courses = Course::where('is_active', true)
                ->whereIn('id', function($query) use ($user, $today) {
                    $query->select('property_packages.course_id')
                        ->from('property_packages')
                        ->join('properties', 'property_packages.property_id', '=', 'properties.id')
                        ->where('properties.tenant_id', $user->tenant_id)
                        ->where('property_packages.is_active', true)
                        ->whereNotNull('property_packages.course_id')
                        ->where(function ($q) use ($today) {
                            $q->whereNull('property_packages.start_date')
                              ->orWhere('property_packages.start_date', '<=', $today);
                        })
                        ->where(function ($q) use ($today) {
                            $q->whereNull('property_packages.end_date')
                              ->orWhere('property_packages.end_date', '>=', $today);
                        });
                })->latest()->get();
            return response()->json($courses);
        }
        return response()->json(Course::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $course = Course::create($validated);

        return response()->json($course, 201);
    }

    public function show(Course $course)
    {
        return response()->json($course);
    }

    public function update(Request $request, Course $course)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $course->update($validated);

        return response()->json($course);
    }

    public function destroy(Course $course)
    {
        $course->delete();
        return response()->noContent();
    }
    public function getPlayerStructure(\Illuminate\Http\Request $request, Course $course)
    {
        $structure = $course->load([
            'levels' => function ($query) {
                $query->where('course_package_levels.is_active', true)
                    ->orderBy('levels.sort_order');
            },
            'levels.chapters' => function ($query) {
                $query->where('level_chapter.is_active', true)
                    ->orderBy('level_chapter.sort_order');
            },
            'levels.chapters.contents' => function ($query) {
                $query->select('contents.id', 'contents.name', 'contents.title', 'contents.sort_order', 'contents.is_active', 'contents.text_content', 'contents.external_url')
                    ->where('contents.is_active', true)
                    ->orderBy('contents.sort_order');
            },
            'levels.chapters.contents.attachments' => function ($query) {
                $query->where('content_attachments.is_deleted', false);
            },
            'levels.chapters.assessments' => function ($query) {
                $query->where('assessments.is_active', true);
            }
        ]);

        $mode = 'strict'; // Default fallback
        $user = $request->user();
        if ($user && $user->role === 'student' && $user->tenant_id) {
            $propPackage = \Illuminate\Support\Facades\DB::table('property_packages')
                ->join('properties', 'property_packages.property_id', '=', 'properties.id')
                ->where('properties.tenant_id', $user->tenant_id)
                ->where('property_packages.course_id', $course->id)
                ->where('property_packages.is_active', true)
                ->select('property_packages.learning_mode_ids')
                ->first();

            if ($propPackage && $propPackage->learning_mode_ids) {
                $modeIds = is_string($propPackage->learning_mode_ids) ? json_decode($propPackage->learning_mode_ids, true) : $propPackage->learning_mode_ids;
                if (is_array($modeIds) && count($modeIds) > 0) {
                    $learningModeObj = \App\Models\LearningMode::find($modeIds[0]);
                    if ($learningModeObj) {
                        $mode = $learningModeObj->code;
                    }
                }
            }
        }

        $structureArray = $structure->toArray();
        $structureArray['learning_mode'] = $mode;

        return response()->json($structureArray);
    }
}
