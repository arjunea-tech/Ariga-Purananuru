<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Announcement::with('tenant');

        if ($user->role === 'super_admin') {
            $selectedTenantId = $request->query('tenant_id');
            if ($selectedTenantId) {
                if ($selectedTenantId === 'global') {
                    $query->whereNull('tenant_id');
                } else if ($selectedTenantId !== 'all') {
                    $query->where('tenant_id', $selectedTenantId);
                }
            }
        } else {
            $query->where(function($q) use ($user) {
                $q->where('tenant_id', $user->tenant_id)
                  ->orWhereNull('tenant_id');
            });
            
            // If not admin, only show announcements targeted to their role or global (null/empty)
            if ($user->role !== 'admin') {
                $query->where(function($q) use ($user) {
                    $q->whereNull('target_roles')
                      ->orWhereJsonLength('target_roles', 0)
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
            'target_roles' => 'nullable|array',
            'tenant_id' => 'nullable'
        ]);

        $user = $request->user();

        $tenantId = null;
        if ($user->role === 'super_admin') {
            $tenantId = (isset($validated['tenant_id']) && $validated['tenant_id'] !== 'global') ? $validated['tenant_id'] : null;
        } else {
            $tenantId = $user->tenant_id;
        }

        $announcement = Announcement::create([
            'tenant_id' => $tenantId,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'target_roles' => $validated['target_roles'] ?? [],
            'created_by' => $user->id
        ]);

        return response()->json($announcement, 201);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'target_roles' => 'nullable|array',
            'tenant_id' => 'nullable'
        ]);

        $user = $request->user();

        $tenantId = null;
        if ($user->role === 'super_admin') {
            $tenantId = (isset($validated['tenant_id']) && $validated['tenant_id'] !== 'global') ? $validated['tenant_id'] : null;
        } else {
            $tenantId = $user->tenant_id;
        }

        $announcement->update([
            'tenant_id' => $tenantId,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'target_roles' => $validated['target_roles'] ?? [],
        ]);

        return response()->json($announcement);
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted']);
    }
}
