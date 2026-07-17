<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Activity;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = Activity::query();
        
        // Scope to tenant or global activities if applicable
        if ($request->user() && $request->user()->tenant_id) {
            $query->where(function ($q) use ($request) {
                $q->where('tenant_id', $request->user()->tenant_id)
                  ->orWhereNull('tenant_id');
            });
        }

        if ($request->has('ids')) {
            $ids = is_array($request->ids) ? $request->ids : explode(',', $request->ids);
            $query->whereIn('id', $ids);
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
            'type' => 'required|string|in:custom,mcq,fill_blanks,match,crossword,word_arrange,speaking,role_play,sequencing,parts_of_speech,mind_map,writing,odd_one_out,word_hunt,letter_basket,word_builder,balloon_pop,yappu_flashcard',
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
