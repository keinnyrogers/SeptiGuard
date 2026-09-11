<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>HOA maintenance requests | SeptiGuard</title>
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body class="min-h-screen bg-slate-950 text-slate-100">
        <header class="border-b border-slate-800 bg-slate-900/80">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                <div>
                    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">SeptiGuard</p>
                    <h1 class="mt-1 text-xl font-bold">HOA maintenance requests</h1>
                </div>
                <a href="{{ route('dashboard') }}" class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-cyan-400 hover:text-cyan-300">Dashboard</a>
            </div>
        </header>

        <main class="mx-auto max-w-6xl px-6 py-12">
            @if (session('status'))
                <div class="mb-6 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-emerald-200">
                    {{ session('status') }}
                </div>
            @endif

            <section class="space-y-6">
                @forelse ($requests as $request)
                    <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p class="text-sm text-slate-400">{{ $request->user->name }} · {{ $request->user->email }}</p>
                                <h3 class="mt-1 text-xl font-bold">{{ $request->title }}</h3>
                            </div>
                            <span class="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
                                {{ $request->status }}
                            </span>
                        </div>

                        <p class="mt-4 text-slate-300">{{ $request->description }}</p>

                        <div class="mt-5 flex items-center gap-3">
                            <form method="POST" action="{{ route('hoa.maintenance-requests.update-status', $request) }}">
                                @csrf
                                @method('PATCH')
                                <input type="hidden" name="status" value="in_progress">
                                <button type="submit" class="rounded-lg border border-amber-400/50 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-400/10">Mark in progress</button>
                            </form>
                            <form method="POST" action="{{ route('hoa.maintenance-requests.update-status', $request) }}">
                                @csrf
                                @method('PATCH')
                                <input type="hidden" name="status" value="completed">
                                <button type="submit" class="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">Mark completed</button>
                            </form>
                            <form method="POST" action="{{ route('hoa.maintenance-requests.update-status', $request) }}">
                                @csrf
                                @method('PATCH')
                                <input type="hidden" name="status" value="rejected">
                                <button type="submit" class="rounded-lg border border-rose-400/60 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-400/10">Reject</button>
                            </form>
                        </div>
                    </div>
                @empty
                    <div class="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                        No maintenance requests pending.
                    </div>
                @endforelse
            </section>
        </main>
    </body>
</html>
