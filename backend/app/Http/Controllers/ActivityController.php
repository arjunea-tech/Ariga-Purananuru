<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Activity;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = Activity::query();
        
        // Scope to tenant if applicable
        if ($request->user() && $request->user()->tenant_id) {
            $query->where('tenant_id', $request->user()->tenant_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string|in:custom,mcq,fill_blanks,match',
            'data_json' => 'nullable|array',
        ]);

        if ($request->user() && $request->user()->tenant_id) {
            $validated['tenant_id'] = $request->user()->tenant_id;
        }
        $validated['created_by'] = $request->user()?->id;

        $activity = Activity::create($validated);

        return response()->json($activity, 201);
    }

    public function show(Request $request, $id)
    {
        $activity = Activity::findOrFail($id);

        if ($request->user() && $request->user()->tenant_id && $activity->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json($activity);
    }

    public function update(Request $request, $id)
    {
        $activity = Activity::findOrFail($id);

        if ($request->user() && $request->user()->tenant_id && $activity->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string',
            'data_json' => 'nullable|array',
        ]);

        $activity->update($validated);

        return response()->json($activity);
    }

    public function destroy(Request $request, $id)
    {
        $activity = Activity::findOrFail($id);

        if ($request->user() && $request->user()->tenant_id && $activity->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $activity->delete();

        return response()->json(null, 204);
    }
}
