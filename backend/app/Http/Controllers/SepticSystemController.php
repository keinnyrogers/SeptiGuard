<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SepticSystemController extends Controller
{
    public function edit(Request $request): View
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        return view('septic-system.edit', ['septicSystem' => $request->user()->septicSystem]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        $validated = $request->validate([
            'tank_type' => ['required', 'string', 'max:255'],
            'capacity_liters' => ['required', 'integer', 'min:1', 'max:1000000'],
            'installation_date' => ['nullable', 'date', 'before_or_equal:today'],
            'last_maintenance_date' => ['nullable', 'date', 'before_or_equal:today'],
            'location' => ['required', 'string', 'max:255'],
        ]);

        $request->user()->septicSystem()->updateOrCreate([], $validated);

        return redirect()->route('septic-system.edit')->with('status', 'Septic system details saved.');
    }
}
