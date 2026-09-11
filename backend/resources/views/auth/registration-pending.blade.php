<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Registration status | SeptiGuard</title>
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body class="min-h-screen bg-slate-950 text-slate-100">
        <main class="mx-auto flex min-h-screen max-w-lg items-center px-6 py-12">
            <section class="w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
                <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">SeptiGuard</p>
                @if ($status === 'rejected')
                    <h1 class="mt-4 text-3xl font-bold">Registration not approved</h1>
                    <p class="mt-3 text-slate-400">Your HOA administrator did not approve this registration request. Please contact the HOA for assistance.</p>
                @else
                    <h1 class="mt-4 text-3xl font-bold">Registration submitted</h1>
                    <p class="mt-3 text-slate-400">Your account is pending HOA approval. You will be able to sign in once an administrator approves your request.</p>
                @endif
                <a href="{{ route('login') }}" class="mt-8 inline-block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Return to login</a>
            </section>
        </main>
    </body>
</html>
