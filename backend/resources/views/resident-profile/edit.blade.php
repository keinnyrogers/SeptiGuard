<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Resident profile | SeptiGuard</title>
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body class="min-h-screen bg-slate-950 text-slate-100">
        <header class="border-b border-slate-800 bg-slate-900/80">
            <div class="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
                <div>
                    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">SeptiGuard</p>
                    <h1 class="mt-1 text-xl font-bold">Resident profile</h1>
                </div>
                <a href="{{ route('dashboard') }}" class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-cyan-400 hover:text-cyan-300">Dashboard</a>
            </div>
        </header>

        <main class="mx-auto max-w-4xl px-6 py-12">
            <div class="mb-8">
                <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">Account details</p>
                <h2 class="mt-2 text-3xl font-bold">Household information</h2>
                <p class="mt-3 text-slate-400">Keep your household details updated so HOA and maintenance records stay accurate.</p>
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

            <form method="POST" action="{{ route('resident-profile.update') }}" class="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                @csrf
                @method('PUT')

                <div>
                    <label for="address" class="block text-sm font-semibold text-slate-200">Address</label>
                    <input id="address" name="address" type="text" value="{{ old('address', $profile?->address) }}" required class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                    @error('address') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label for="contact_number" class="block text-sm font-semibold text-slate-200">Contact number</label>
                    <input id="contact_number" name="contact_number" type="text" value="{{ old('contact_number', $profile?->contact_number) }}" required class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                    @error('contact_number') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label for="household_members" class="block text-sm font-semibold text-slate-200">Household members</label>
                    <input id="household_members" name="household_members" type="number" min="1" max="50" value="{{ old('household_members', $profile?->household_members ?? 1) }}" required class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                    @error('household_members') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label for="notes" class="block text-sm font-semibold text-slate-200">Notes</label>
                    <textarea id="notes" name="notes" rows="5" class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">{{ old('notes', $profile?->notes) }}</textarea>
                    @error('notes') <p class="mt-2 text-sm text-rose-300">{{ $message }}</p> @enderror
                </div>

                <button type="submit" class="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Save profile</button>
            </form>
        </main>
    </body>
</html>
