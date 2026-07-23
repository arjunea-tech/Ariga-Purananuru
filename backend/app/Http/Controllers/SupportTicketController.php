<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupportTicketController extends Controller
{
    /**
     * Student: Submit a support ticket (goes to tenant admin + super admin).
     */
    public function store(Request $request)
    {
        $request->validate([
            'subject'  => 'required|string|max:255',
            'message'  => 'required|string|max:5000',
            'category' => 'sometimes|in:general,technical,content,billing,other',
            'priority' => 'sometimes|in:low,normal,high,urgent',
        ]);

        $user = Auth::user();

        $ticket = SupportTicket::create([
            'user_id'   => $user->id,
            'tenant_id' => $user->tenant_id ?? null,
            'subject'   => $request->subject,
            'message'   => $request->message,
            'category'  => $request->category ?? 'general',
            'priority'  => $request->priority ?? 'normal',
            'status'    => 'open',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your support ticket has been submitted. Admin will respond soon.',
            'ticket'  => [
                'id'        => $ticket->id,
                'subject'   => $ticket->subject,
                'category'  => $ticket->category,
                'priority'  => $ticket->priority,
                'status'    => $ticket->status,
                'created_at'=> $ticket->created_at->toDateTimeString(),
            ],
        ], 201);
    }

    /**
     * Student: View their own tickets.
     */
    public function myTickets(Request $request)
    {
        $tickets = SupportTicket::where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => [
                'id'          => $t->id,
                'subject'     => $t->subject,
                'category'    => $t->category,
                'priority'    => $t->priority,
                'status'      => $t->status,
                'admin_reply' => $t->admin_reply,
                'replied_at'  => $t->replied_at?->toDateTimeString(),
                'created_at'  => $t->created_at->toDateTimeString(),
            ]);

        return response()->json(['tickets' => $tickets]);
    }

    /**
     * Admin/Staff: List all tickets for this tenant.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = SupportTicket::with('user')
            ->orderByDesc('created_at');

        // Super admin sees all, tenant admin/staff see only their tenant
        if (!in_array($user->role, ['super_admin'])) {
            $query->where('tenant_id', $user->tenant_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $tickets = $query->get()->map(fn($t) => [
            'id'            => $t->id,
            'subject'       => $t->subject,
            'message'       => $t->message,
            'category'      => $t->category,
            'priority'      => $t->priority,
            'status'        => $t->status,
            'admin_reply'   => $t->admin_reply,
            'replied_at'    => $t->replied_at?->toDateTimeString(),
            'created_at'    => $t->created_at->toDateTimeString(),
            'student_name'  => $t->user?->name,
            'student_email' => $t->user?->email,
        ]);

        return response()->json(['tickets' => $tickets]);
    }

    /**
     * Admin/Staff: Reply to a ticket and update its status.
     */
    public function reply(Request $request, $id)
    {
        $request->validate([
            'admin_reply' => 'required|string|max:5000',
            'status'      => 'sometimes|in:open,in_progress,resolved,closed',
        ]);

        $user   = Auth::user();
        $ticket = SupportTicket::findOrFail($id);

        // Tenant scoping
        if (!in_array($user->role, ['super_admin']) && $ticket->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $ticket->update([
            'admin_reply' => $request->admin_reply,
            'status'      => $request->status ?? 'in_progress',
            'replied_at'  => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reply sent successfully.',
            'ticket'  => $ticket,
        ]);
    }
}
