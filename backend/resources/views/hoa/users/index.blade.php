<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Pending registrations | SeptiGuard</title>
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body class="min-h-screen bg-slate-950 text-slate-100">
        <header class="border-b border-slate-800 bg-slate-900/80">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                <div>
                    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">SeptiGuard</p>
                    <h1 class="mt-1 text-xl font-bold">HOA approval dashboard</h1>
                </div>
                <a href="{{ route('dashboard') }}" class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-cyan-400 hover:text-cyan-300">Dashboard</a>
            </div>
        </header>

        <main class="mx-auto max-w-6xl px-6 py-12">
            <div class="mb-8">
                <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">Account management</p>
                <h2 class="mt-2 text-3xl font-bold">Pending registrations</h2>
                <p class="mt-3 text-slate-400">Review resident registrations before they can access SeptiGuard.</p>
            </div>

            @if (session('status'))
                <div class="mb-6 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-emerald-200">
                    {{ session('status') }}
                </div>
            @endif

            <section class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                @forelse ($pendingUsers as $user)
                    <div class="flex flex-col gap-5 border-b border-slate-800 p-6 last:border-b-0 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 class="font-semibold">{{ $user->name }}</h3>
                            <p class="mt-1 text-sm text-slate-400">{{ $user->email }}</p>
                            <p class="mt-2 text-xs text-slate-500">Registered {{ $user->created_at->format('M j, Y g:i A') }}</p>
                        </div>
                        <div class="flex gap-3">
                            <form method="POST" action="{{ route('hoa.users.approve', $user) }}">
                                @csrf
                                <button type="submit" class="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">Approve</button>
                            </form>
                            <form method="POST" action="{{ route('hoa.users.reject', $user) }}">
                                @csrf
                                <button type="submit" class="rounded-lg border border-rose-400/60 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-400/10">Reject</button>
                            </form>
                        </div>
                    </div>
                @empty
                    <p class="p-8 text-center text-slate-400">There are no pending registrations.</p>
                @endforelse
            </section>
        </main>
    </body>
</html>
