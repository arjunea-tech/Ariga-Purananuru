<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $user      = $request->user();
        $search    = $request->query('search', '');
        $perPage   = (int) $request->query('per_page', 0); // 0 = return all (backwards-compat)
        $paginate  = $perPage > 0;

        $query = Course::where('is_active', true);

        // Tenant-scoped filtering for students
        if ($user && $user->role === 'student' && $user->tenant_id) {
            $today = now()->toDateString();
            
            $query->where(function ($queryBuilder) use ($user, $today) {
                // 1. Courses they have access to via their tenant/school
                $queryBuilder->whereIn('id', function ($q) use ($user, $today) {
                    $q->select('property_packages.course_id')
                        ->from('property_packages')
                        ->join('properties', 'property_packages.property_id', '=', 'properties.id')
                        ->where('properties.tenant_id', $user->tenant_id)
                        ->where('property_packages.is_active', true)
                        ->whereNotNull('property_packages.course_id')
                        ->where(function ($q2) use ($today) {
                            $q2->whereNull('property_packages.start_date')
                               ->orWhere('property_packages.start_date', '<=', $today);
                        })
                        ->where(function ($q2) use ($today) {
                            $q2->whereNull('property_packages.end_date')
                               ->orWhere('property_packages.end_date', '>=', $today);
                        });
                })
                // 2. Courses they have explicitly purchased (B2C)
                ->orWhereIn('id', function ($q) use ($user) {
                    $q->select('course_id')
                        ->from('user_purchases')
                        ->where('user_id', $user->id)
                        ->where('status', 'successful');
                });
            });
        }

        // Search by name or title
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%");
            });
        }

        $query->latest();

        if ($paginate) {
            $result = $query->paginate($perPage);
            return response()->json([
                'data'         => $result->items(),
                'total'        => $result->total(),
                'per_page'     => $result->perPage(),
                'current_page' => $result->currentPage(),
                'last_page'    => $result->lastPage(),
            ]);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'price' => 'nullable|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'cover_image' => 'nullable|string',
            'tags' => 'nullable|array',
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
            'price' => 'nullable|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'cover_image' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        $course->update($validated);

        return response()->json($course);
    }

    public function destroy(Course $course)
    {
        $course->delete();
        return response()->noContent();
    }

    public function uploadCoverImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048', // 2MB max
        ]);

        if ($request->hasFile('image')) {
            try {
                $file = $request->file('image');
                $response = cloudinary()->uploadApi()->upload($file->getRealPath(), [
                    'folder' => 'courses/covers',
                ]);
                return response()->json(['url' => $response['secure_url']]);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Image upload to Cloudinary failed: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['message' => 'Image upload failed'], 400);
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

    public function getStorefront(Request $request)
    {
        $user = auth('sanctum')->user();
        
        $purchasedCourseIds = [];
        if ($user) {
            $purchasedCourseIds = \Illuminate\Support\Facades\DB::table('user_purchases')
                ->where('user_id', $user->id)
                ->where('status', 'successful')
                ->pluck('course_id')
                ->toArray();
        }

        $courses = Course::where('is_active', true)
            ->whereNotIn('id', $purchasedCourseIds)
            ->get()
            ->map(function ($course) {
                // Add a default price of 500 for the store if it doesn't exist in DB
                $course->price = $course->price ?? 500;
                return $course;
            });

        return response()->json($courses);
    }
}
