<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function index()
    {
        return Property::with(['tenant', 'packages'])->orderBy('created_at', 'desc')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'property_code' => 'required|unique:properties,property_code',
            'property_name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'max_users' => 'integer|min:1',
            'is_active' => 'boolean',
            'packages' => 'nullable|array',
            'packages.*.id' => 'required|exists:packages,id',
            'packages.*.course_id' => 'nullable|exists:courses,id',
            'packages.*.start_date' => 'nullable|date',
            'packages.*.end_date' => 'nullable|date|after_or_equal:packages.*.start_date',
            'packages.*.is_active' => 'nullable|boolean',
            'packages.*.learning_mode_ids' => 'nullable|array',
        ]);

        $property = Property::create($validated);

        if (isset($validated['packages'])) {
            \Illuminate\Support\Facades\DB::table('property_packages')->where('property_id', $property->id)->delete();
            $insertData = [];
            foreach ($validated['packages'] as $pkg) {
                $insertData[] = [
                    'property_id' => $property->id,
                    'package_id' => $pkg['id'],
                    'course_id' => $pkg['course_id'] ?? null,
                    'start_date' => $pkg['start_date'] ?? null,
                    'end_date' => $pkg['end_date'] ?? null,
                    'is_active' => $pkg['is_active'] ?? true,
                    'learning_mode_ids' => isset($pkg['learning_mode_ids']) ? json_encode($pkg['learning_mode_ids']) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            if (!empty($insertData)) {
                \Illuminate\Support\Facades\DB::table('property_packages')->insert($insertData);
            }
        }

        return $property->load(['tenant', 'packages']);
    }

    public function show(Property $property)
    {
        return $property->load(['tenant', 'packages']);
    }

    public function update(Request $request, Property $property)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'property_code' => 'required|unique:properties,property_code,' . $property->id,
            'property_name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'max_users' => 'integer|min:1',
            'is_active' => 'boolean',
            'packages' => 'nullable|array',
            'packages.*.id' => 'required|exists:packages,id',
            'packages.*.course_id' => 'nullable|exists:courses,id',
            'packages.*.start_date' => 'nullable|date',
            'packages.*.end_date' => 'nullable|date|after_or_equal:packages.*.start_date',
            'packages.*.is_active' => 'nullable|boolean',
            'packages.*.learning_mode_ids' => 'nullable|array',
        ]);

        $property->update($validated);

        if (isset($validated['packages'])) {
            \Illuminate\Support\Facades\DB::table('property_packages')->where('property_id', $property->id)->delete();
            $insertData = [];
            foreach ($validated['packages'] as $pkg) {
                $insertData[] = [
                    'property_id' => $property->id,
                    'package_id' => $pkg['id'],
                    'course_id' => $pkg['course_id'] ?? null,
                    'start_date' => $pkg['start_date'] ?? null,
                    'end_date' => $pkg['end_date'] ?? null,
                    'is_active' => $pkg['is_active'] ?? true,
                    'learning_mode_ids' => isset($pkg['learning_mode_ids']) ? json_encode($pkg['learning_mode_ids']) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            if (!empty($insertData)) {
                \Illuminate\Support\Facades\DB::table('property_packages')->insert($insertData);
            }
        }

        return $property->load(['tenant', 'packages']);
    }

    public function destroy(Property $property)
    {
        $property->delete();
        return response()->noContent();
    }
}
