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
        if ($user && $user->role === 'student') {
            $isB2c = false;
            if (!$user->tenant_id) {
                $isB2c = true;
            } else {
                $tenant = \App\Models\Tenant::find($user->tenant_id);
                if (!$tenant || $tenant->tenant_code === 'PUBLIC') {
                    $isB2c = true;
                }
            }

            if ($isB2c) {
                // B2C Student: show ONLY purchased courses
                $purchasedCourseIds = DB::table('user_purchases')
                    ->where('user_id', $user->id)
                    ->where('status', 'successful')
                    ->pluck('course_id')
                    ->toArray();

                $query->whereIn('id', $purchasedCourseIds);
            } else {
                // B2B Student: show courses assigned to their tenant school
                $today = now()->toDateString();
                $query->where(function ($queryBuilder) use ($user, $today) {
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
                    ->orWhereIn('id', function ($q) use ($user, $today) {
                        $q->select('course_package_levels.course_id')
                            ->from('property_packages')
                            ->join('properties', 'property_packages.property_id', '=', 'properties.id')
                            ->join('course_package_levels', 'property_packages.package_id', '=', 'course_package_levels.package_id')
                            ->where('properties.tenant_id', $user->tenant_id)
                            ->where('property_packages.is_active', true)
                            ->where(function ($q2) use ($today) {
                                $q2->whereNull('property_packages.start_date')
                                   ->orWhere('property_packages.start_date', '<=', $today);
                            })
                            ->where(function ($q2) use ($today) {
                                $q2->whereNull('property_packages.end_date')
                                   ->orWhere('property_packages.end_date', '>=', $today);
                            });
                    });
                });
            }
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
        try {
            $structure = $course->load([
                'levels' => function ($query) {
                    $query->orderBy('levels.sort_order');
                },
                'levels.chapters' => function ($query) {
                    $query->orderBy('level_chapter.sort_order');
                },
                'levels.chapters.contents' => function ($query) {
                    $query->where('contents.is_active', true)
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
                if (\Illuminate\Support\Facades\Schema::hasTable('property_packages') && \Illuminate\Support\Facades\Schema::hasTable('properties')) {
                    $propPackage = \Illuminate\Support\Facades\DB::table('property_packages')
                        ->join('properties', 'property_packages.property_id', '=', 'properties.id')
                        ->where('properties.tenant_id', $user->tenant_id)
                        ->where('property_packages.course_id', $course->id)
                        ->where('property_packages.is_active', true)
                        ->select('property_packages.learning_mode_ids')
                        ->first();

                    if ($propPackage && isset($propPackage->learning_mode_ids) && $propPackage->learning_mode_ids) {
                        $modeIds = is_string($propPackage->learning_mode_ids) ? json_decode($propPackage->learning_mode_ids, true) : $propPackage->learning_mode_ids;
                        if (is_array($modeIds) && count($modeIds) > 0 && \Illuminate\Support\Facades\Schema::hasTable('learning_modes')) {
                            $learningModeObj = \App\Models\LearningMode::find($modeIds[0]);
                            if ($learningModeObj) {
                                $mode = $learningModeObj->code;
                            }
                        }
                    }
                }
            }

            $structureArray = $structure->toArray();
            $structureArray['learning_mode'] = $mode;

            return response()->json($structureArray);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('getPlayerStructure error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            $res = $course->toArray();
            $res['learning_mode'] = 'strict';
            return response()->json($res);
        }
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
