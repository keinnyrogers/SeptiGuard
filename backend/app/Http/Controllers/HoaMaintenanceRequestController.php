<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class HoaMaintenanceRequestController extends Controller
{
    public function index(): View
    {
        return view('hoa.maintenance-requests.index', [
            'requests' => MaintenanceRequest::query()->with('user')->latest()->get(),
        ]);
    }

    public function updateStatus(Request $request, MaintenanceRequest $maintenanceRequest): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'in:submitted,in_progress,completed,rejected'],
        ]);

        $maintenanceRequest->update([
            'status' => $request->input('status'),
        ]);

        return redirect()->route('hoa.maintenance-requests.index')->with('status', 'Request status updated.');
    }
}
