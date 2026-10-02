<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        abort_unless($token, 401, 'Unauthenticated.');

        $user = User::query()
            ->where('api_token_hash', hash('sha256', $token))
            ->first();

        abort_unless($user, 401, 'Unauthenticated.');
        $request->setUserResolver(fn (): User => $user);

        return $next($request);
    }
}
