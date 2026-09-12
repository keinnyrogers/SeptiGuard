<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class HoaMaintenanceRequestController extends Controller
{
    public function index(): View
    {
        return view('hoa.maintenance-requests.index', [
            'requests' => Complaint::query()->with('user')->latest()->get(),
        ]);
    }

    public function updateStatus(Request $request, Complaint $complaint): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'in:pending,in_progress,completed,rejected'],
        ]);

        $complaint->update([
            'status' => $request->input('status'),
            'resolved_at' => $request->input('status') === 'completed' ? now() : null,
        ]);

        return redirect()->route('hoa.maintenance-requests.index')->with('status', 'Request status updated.');
    }
}
