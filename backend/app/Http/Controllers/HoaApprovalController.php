<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class HoaApprovalController extends Controller
{
    public function index(): View
    {
        $pendingUsers = User::query()
            ->where('role', 'resident')
            ->where('account_status', 'pending')
            ->latest()
            ->get();

        return view('hoa.users.index', ['pendingUsers' => $pendingUsers]);
    }

    public function approve(User $user): RedirectResponse
    {
        abort_unless($user->role === 'resident' && $user->account_status === 'pending', 404);

        $user->update(['account_status' => 'approved']);

        return back()->with('status', 'Resident account approved.');
    }

    public function reject(User $user): RedirectResponse
    {
        abort_unless($user->role === 'resident' && $user->account_status === 'pending', 404);

        $user->update(['account_status' => 'rejected']);

        return back()->with('status', 'Resident account rejected.');
    }
}
