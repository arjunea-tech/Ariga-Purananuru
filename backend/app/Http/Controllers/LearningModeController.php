<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\LearningMode;
use Illuminate\Http\Request;

class LearningModeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user && $user->role === 'student' && $user->tenant_id) {
            $allowedModeIds = \Illuminate\Support\Facades\DB::table('property_packages')
                ->join('properties', 'property_packages.property_id', '=', 'properties.id')
                ->where('properties.tenant_id', $user->tenant_id)
                ->where('properties.is_active', true)
                ->where('property_packages.is_active', true)
                ->whereNotNull('property_packages.learning_mode_ids')
                ->pluck('property_packages.learning_mode_ids')
                ->flatMap(function ($item) {
                    $decoded = json_decode($item, true);
                    return is_array($decoded) ? $decoded : [];
                })
                ->unique()
                ->toArray();

            if (!empty($allowedModeIds)) {
                return response()->json(LearningMode::whereIn('id', $allowedModeIds)->where('is_active', true)->latest()->get());
            }
        }
        return response()->json(LearningMode::where('is_active', true)->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:learning_modes,code',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $learningMode = LearningMode::create($validated);

        return response()->json($learningMode, 201);
    }

    public function show(LearningMode $learningMode)
    {
        return response()->json($learningMode);
    }

    public function update(Request $request, LearningMode $learningMode)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:learning_modes,code,' . $learningMode->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $learningMode->update($validated);

        return response()->json($learningMode);
    }

    public function destroy(LearningMode $learningMode)
    {
        $learningMode->delete();
        return response()->noContent();
    }
}
