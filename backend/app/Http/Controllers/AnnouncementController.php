<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Announcement::query();

        if ($user->role !== 'super_admin') {
            $query->where('tenant_id', $user->tenant_id);
            
            // If not admin, only show announcements targeted to their role or global (null/empty)
            if ($user->role !== 'admin') {
                $query->where(function($q) use ($user) {
                    $q->whereNull('target_roles')
                      ->orWhereJsonContains('target_roles', $user->role);
                });
            }
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'target_roles' => 'nullable|array'
        ]);

        $user = $request->user();

        $announcement = Announcement::create([
            'tenant_id' => $user->role === 'super_admin' ? null : $user->tenant_id,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'target_roles' => $validated['target_roles'] ?? [],
            'created_by' => $user->id
        ]);

        return response()->json($announcement, 201);
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted']);
    }
}
