<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class MaintenanceRequestController extends Controller
{
    public function index(Request $request): View
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        return view('maintenance-requests.index', [
            'requests' => $request->user()->complaints()->latest()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'request_type' => ['required', 'string', 'max:255'],
            'priority' => ['required', 'in:low,medium,high'],
            'description' => ['required', 'string', 'max:2000'],
        ]);

        $request->user()->complaints()->create([
            'title' => $validated['title'],
            'category' => $validated['request_type'],
            'priority' => $validated['priority'],
            'description' => $validated['description'],
            'ticket_code' => Complaint::generateTicketCode(),
            'status' => 'pending',
        ]);

        return redirect()->route('maintenance-requests.index')->with('status', 'Maintenance request submitted.');
    }
}
