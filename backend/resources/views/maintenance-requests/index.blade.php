<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Maintenance requests | SeptiGuard</title>
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body class="min-h-screen bg-slate-950 text-slate-100">
        <header class="border-b border-slate-800 bg-slate-900/80">
            <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                <div>
                    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">SeptiGuard</p>
                    <h1 class="mt-1 text-xl font-bold">Maintenance requests</h1>
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

            <section class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 class="text-2xl font-bold">Submit a request</h2>
                <form method="POST" action="{{ route('maintenance-requests.store') }}" class="mt-6 space-y-5">
                    @csrf

                    <div>
                        <label for="title" class="block text-sm font-semibold text-slate-200">Title</label>
                        <input id="title" name="title" type="text" value="{{ old('title') }}" required class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                        @error('title') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                    </div>

                    <div>
                        <label for="request_type" class="block text-sm font-semibold text-slate-200">Request type</label>
                        <input id="request_type" name="request_type" type="text" value="{{ old('request_type') }}" required class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                        @error('request_type') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                    </div>

                    <div>
                        <label for="priority" class="block text-sm font-semibold text-slate-200">Priority</label>
                        <select id="priority" name="priority" class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div>
                        <label for="description" class="block text-sm font-semibold text-slate-200">Description</label>
                        <textarea id="description" name="description" rows="5" required class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">{{ old('description') }}</textarea>
                        @error('description') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                    </div>

                    <button type="submit" class="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Submit request</button>
                </form>
            </section>

            <section class="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <div class="border-b border-slate-800 px-6 py-4">
                    <h3 class="text-xl font-bold">Your requests</h3>
                </div>

                @forelse ($requests as $request)
                    <div class="border-b border-slate-800 p-6 last:border-b-0">
                        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h4 class="text-lg font-semibold">{{ $request->title }}</h4>
                                <p class="mt-1 text-sm text-slate-400">{{ $request->request_type }} · {{ ucfirst($request->priority) }} priority</p>
                            </div>
                            <span class="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
                                {{ $request->status }}
                            </span>
                        </div>
                        <p class="mt-4 text-slate-300">{{ $request->description }}</p>
                    </div>
                @empty
                    <p class="p-8 text-center text-slate-400">No maintenance requests yet.</p>
                @endforelse
            </section>
        </main>
    </body>
</html>
