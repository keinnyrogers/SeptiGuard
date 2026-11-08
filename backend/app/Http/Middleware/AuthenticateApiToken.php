<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Models\UserApiToken;
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

        $tokenHash = hash('sha256', $token);
        $user = UserApiToken::query()
            ->where('token_hash', $tokenHash)
            ->first()
            ?->user;

        // Continue accepting tokens issued before multi-device sessions were added.
        $user ??= User::query()
            ->where('api_token_hash', $tokenHash)
            ->first();

        abort_unless($user, 401, 'Unauthenticated.');
        $request->setUserResolver(fn (): User => $user);

        return $next($request);
    }
}
