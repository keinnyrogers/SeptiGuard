<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Dashboard | SeptiGuard</title>
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body class="min-h-screen bg-slate-950 text-slate-100">
        <header class="border-b border-slate-800 bg-slate-900/80">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                <div>
                    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">SeptiGuard</p>
                    <h1 class="mt-1 text-xl font-bold">Resident dashboard</h1>
                </div>
                <div class="flex items-center gap-3">
                    @if ($user->role === 'hoa_admin')
                        <a href="{{ route('hoa.users.pending') }}" class="rounded-lg border border-cyan-400/60 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10">Pending registrations</a>
                    @endif
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit" class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-cyan-400 hover:text-cyan-300">Log out</button>
                    </form>
                </div>
            </div>
        </header>

        <main class="mx-auto max-w-6xl px-6 py-12">
            <div class="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-6">
                <p class="text-sm text-cyan-200">Signed in as {{ $user->email }}</p>
                <h2 class="mt-2 text-3xl font-bold">Welcome, {{ $user->name }}.</h2>
                <p class="mt-3 max-w-2xl text-slate-300">Your SeptiGuard monitoring workspace is ready. Tank readings, predictions, and complaints will appear here as we build the prototype.</p>
            </div>

            <div class="mt-8 grid gap-6 md:grid-cols-3">
                <article class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p class="text-sm text-slate-400">Tank status</p>
                    @if ($latestReading)
                        <p class="mt-4 text-2xl font-bold {{ $latestReading->status === 'critical' ? 'text-rose-400' : ($latestReading->status === 'warning' ? 'text-amber-300' : 'text-emerald-400') }}">{{ ucfirst($latestReading->status) }}</p>
                        <p class="mt-2 text-slate-300">{{ $latestReading->fill_level_percentage }}% full</p>
                    @else
                        <p class="mt-4 text-2xl font-bold text-slate-500">No sensor data</p>
                    @endif
                </article>
                <article class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p class="text-sm text-slate-400">Next prediction</p>
                    <p class="mt-4 text-2xl font-bold text-slate-500">Not available</p>
                </article>
                <article class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p class="text-sm text-slate-400">Open complaints</p>
                    <p class="mt-4 text-2xl font-bold text-slate-100">{{ $openComplaintsCount }}</p>
                </article>
            </div>

            @if ($user->role === 'resident')
                <section class="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <div class="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">Monitoring history</p>
                            <h2 class="mt-2 text-2xl font-bold">Recent tank readings</h2>
                        </div>
                        @if ($latestReading)
                            <p class="text-sm text-slate-400">Updated {{ $latestReading->measured_at->format('M j, Y g:i A') }}</p>
                        @endif
                    </div>

                    @if ($recentReadings->isEmpty())
                        <p class="mt-6 text-slate-400">No tank readings are available yet.</p>
                    @else
                        <div class="mt-6 overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead class="border-b border-slate-700 text-slate-400">
                                    <tr>
                                        <th class="pb-3 pr-4 font-medium">Measured</th>
                                        <th class="pb-3 pr-4 font-medium">Fill level</th>
                                        <th class="pb-3 pr-4 font-medium">Distance</th>
                                        <th class="pb-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach ($recentReadings as $reading)
                                        <tr class="border-b border-slate-800 last:border-0">
                                            <td class="py-4 pr-4 text-slate-300">{{ $reading->measured_at->format('M j, Y g:i A') }}</td>
                                            <td class="py-4 pr-4 font-semibold">{{ $reading->fill_level_percentage }}%</td>
                                            <td class="py-4 pr-4 text-slate-300">{{ $reading->distance_cm !== null ? $reading->distance_cm.' cm' : 'Not recorded' }}</td>
                                            <td class="py-4 capitalize text-slate-300">{{ $reading->status }}</td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    @endif
                </section>
            @endif

            @if ($user->role === 'resident')
                <div class="mt-8 flex flex-wrap gap-4">
                    <a href="{{ route('resident-profile.edit') }}" class="inline-block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Resident profile</a>
                    <a href="{{ route('septic-system.edit') }}" class="inline-block rounded-lg border border-slate-700 px-5 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300">Manage septic system</a>
                    <a href="{{ route('maintenance-requests.index') }}" class="inline-block rounded-lg border border-slate-700 px-5 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300">Complaints</a>
                </div>
            @endif
        </main>
    </body>
</html>
