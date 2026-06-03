<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index()
    {
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
    public function getPlayerStructure(Course $course)
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
                $query->select('contents.id', 'contents.name', 'contents.title', 'contents.sort_order', 'contents.is_active')
                    ->where('contents.is_active', true)
                    ->orderBy('contents.sort_order');
            },
            'levels.chapters.assessments' => function ($query) {
                $query->where('assessments.is_active', true);
            }
        ]);

        return response()->json($structure);
    }
}
