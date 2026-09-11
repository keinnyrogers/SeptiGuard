<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class MaintenanceRequestController extends Controller
{
    public function index(Request $request): View
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        return view('maintenance-requests.index', [
            'requests' => $request->user()->maintenanceRequests()->latest()->get(),
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

        $request->user()->maintenanceRequests()->create([
            ...$validated,
            'status' => 'submitted',
        ]);

        return redirect()->route('maintenance-requests.index')->with('status', 'Maintenance request submitted.');
    }
}
