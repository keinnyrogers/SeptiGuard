<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Log in | SeptiGuard</title>
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body class="min-h-screen bg-slate-950 text-slate-100">
        <main class="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
            <section class="w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">SeptiGuard</p>
                <h1 class="mt-3 text-3xl font-bold">Welcome back</h1>
                <p class="mt-2 text-slate-400">Sign in to monitor your septic tank.</p>

                @if ($errors->any())
                    <div class="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                        {{ $errors->first() }}
                    </div>
                @endif

                <form method="POST" action="{{ url('/login') }}" class="mt-8 space-y-5">
                    @csrf
                    <div>
                        <label for="email" class="block text-sm font-medium text-slate-300">Email</label>
                        <input id="email" name="email" type="email" value="{{ old('email') }}" required autofocus class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-400 focus:ring-2">
                    </div>
                    <div>
                        <label for="password" class="block text-sm font-medium text-slate-300">Password</label>
                        <input id="password" name="password" type="password" required class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-cyan-400 focus:ring-2">
                    </div>
                    <label class="flex items-center gap-2 text-sm text-slate-400">
                        <input name="remember" type="checkbox" value="1" class="rounded border-slate-700 bg-slate-950 text-cyan-400">
                        Remember me
                    </label>
                    <button type="submit" class="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">Log in</button>
                </form>

                <p class="mt-8 text-center text-sm text-slate-400">
                    Need an account?
                    <a href="{{ route('register') }}" class="font-semibold text-cyan-400 hover:text-cyan-300">Register</a>
                </p>
            </section>
        </main>
    </body>
</html>
