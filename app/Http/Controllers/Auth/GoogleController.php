<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Invite;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        $googleUser = Socialite::driver('google')->user();
        $email = $googleUser->getEmail();

        $user = User::where('email', $email)->first();
        $invite = null;

        if (!$user) {
            $invite = Invite::where('email', $email)->where('status', 'pending')->first();
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $googleUser->getName(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
                'password' => bcrypt(str()->random(32)),
                'admin_id' => $invite ? $invite->admin_id : ($user->admin_id ?? null),
                'role_id' => $invite ? $invite->role_id : ($user->role_id ?? null),
            ]
        );

        if ($invite) {
            $invite->update(['status' => 'accepted']);
        }

        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard'));
    }

    public function logout()
    {
        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect()->route('login');
    }
}
