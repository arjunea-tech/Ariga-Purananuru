<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PropertyController extends Controller
{
    private function loadPropertyWithPackages($property)
    {
        $property->load('tenant');
        
        $packages = DB::table('property_packages')
            ->join('packages', 'property_packages.package_id', '=', 'packages.id')
            ->where('property_packages.property_id', $property->id)
            ->select(
                'packages.*', 
                'property_packages.id as pivot_id', 
                'property_packages.course_id as pivot_course_id', 
                'property_packages.start_date as pivot_start_date', 
                'property_packages.end_date as pivot_end_date', 
                'property_packages.is_active as pivot_is_active', 
                'property_packages.learning_mode_ids as pivot_learning_mode_ids'
            )
            ->get();
            
        $formattedPackages = [];
        foreach ($packages as $pkg) {
            $formattedPackages[] = [
                'id' => $pkg->id,
                'name' => $pkg->name,
                'code' => $pkg->code,
                'description' => $pkg->description,
                'is_active' => $pkg->is_active,
                'pivot' => [
                    'property_id' => $property->id,
                    'package_id' => $pkg->id,
                    'id' => $pkg->pivot_id,
                    'course_id' => $pkg->pivot_course_id,
                    'start_date' => $pkg->pivot_start_date,
                    'end_date' => $pkg->pivot_end_date,
                    'is_active' => $pkg->pivot_is_active,
                    'learning_mode_ids' => $pkg->pivot_learning_mode_ids,
                ]
            ];
        }
        
        $property->setRelation('packages', collect($formattedPackages));
        return $property;
    }

    public function index()
    {
        $properties = Property::orderBy('created_at', 'desc')->get();
        foreach ($properties as $property) {
            $this->loadPropertyWithPackages($property);
        }
        return $properties;
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
            DB::table('property_packages')->where('property_id', $property->id)->delete();
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
                DB::table('property_packages')->insert($insertData);
            }
        }

        return $this->loadPropertyWithPackages($property);
    }

    public function show(Property $property)
    {
        return $this->loadPropertyWithPackages($property);
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
            DB::table('property_packages')->where('property_id', $property->id)->delete();
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
                DB::table('property_packages')->insert($insertData);
            }
        }

        return $this->loadPropertyWithPackages($property);
    }

    public function destroy(Property $property)
    {
        $property->delete();
        return response()->noContent();
    }
}
