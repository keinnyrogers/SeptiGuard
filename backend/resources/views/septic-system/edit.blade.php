<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Septic system | SeptiGuard</title>
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body class="min-h-screen bg-slate-950 text-slate-100">
        <header class="border-b border-slate-800 bg-slate-900/80">
            <div class="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
                <div>
                    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">SeptiGuard</p>
                    <h1 class="mt-1 text-xl font-bold">Septic system details</h1>
                </div>
                <a href="{{ route('dashboard') }}" class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-cyan-400 hover:text-cyan-300">Dashboard</a>
            </div>
        </header>

        <main class="mx-auto max-w-4xl px-6 py-12">
            <div class="mb-8">
                <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">Resident profile</p>
                <h2 class="mt-2 text-3xl font-bold">Register your septic system</h2>
                <p class="mt-3 text-slate-400">Keep your septic information current for monitoring and maintenance planning.</p>
            </div>

            @if (session('status'))
                <div class="mb-6 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-emerald-200">
                    {{ session('status') }}
                </div>
            @endif

            @if ($errors->any())
                <div class="mb-6 rounded-lg border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-rose-200">
                    Please correct the highlighted information.
                </div>
            @endif

            <form method="POST" action="{{ route('septic-system.update') }}" class="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                @csrf
                @method('PUT')

                <div>
                    <label for="tank_type" class="block text-sm font-semibold text-slate-200">Tank type</label>
                    <input id="tank_type" name="tank_type" type="text" value="{{ old('tank_type', $septicSystem?->tank_type) }}" required class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                    @error('tank_type') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label for="capacity_liters" class="block text-sm font-semibold text-slate-200">Capacity (liters)</label>
                    <input id="capacity_liters" name="capacity_liters" type="number" min="1" max="1000000" value="{{ old('capacity_liters', $septicSystem?->capacity_liters) }}" required class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                    @error('capacity_liters') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                </div>

                <div class="grid gap-6 md:grid-cols-2">
                    <div>
                        <label for="installation_date" class="block text-sm font-semibold text-slate-200">Installation date</label>
                        <input id="installation_date" name="installation_date" type="date" value="{{ old('installation_date', $septicSystem?->installation_date?->format('Y-m-d')) }}" class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                        @error('installation_date') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="last_maintenance_date" class="block text-sm font-semibold text-slate-200">Last maintenance date</label>
                        <input id="last_maintenance_date" name="last_maintenance_date" type="date" value="{{ old('last_maintenance_date', $septicSystem?->last_maintenance_date?->format('Y-m-d')) }}" class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                        @error('last_maintenance_date') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                    </div>
                </div>

                <div>
                    <label for="location" class="block text-sm font-semibold text-slate-200">Location</label>
                    <input id="location" name="location" type="text" value="{{ old('location', $septicSystem?->location) }}" required class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                    @error('location') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                </div>

                <button type="submit" class="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Save septic details</button>
            </form>
        </main>
    </body>
</html>
