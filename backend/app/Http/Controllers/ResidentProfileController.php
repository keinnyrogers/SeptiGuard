<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ResidentProfileController extends Controller
{
    public function edit(Request $request): View
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        return view('resident-profile.edit', ['profile' => $request->user()->residentProfile]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        $validated = $request->validate([
            'address' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
            'household_members' => ['required', 'integer', 'min:1', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $user->residentProfile()->updateOrCreate(
            ['user_id' => $user->id],
            $validated,
        );

        return redirect()->route('resident-profile.edit')->with('status', 'Resident profile saved.');
    }
}
