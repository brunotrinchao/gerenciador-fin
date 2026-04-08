<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleCalendarController extends Controller
{
    /**
     * Redireciona para o Google pedindo permissão de Calendar.
     * Usa access_type=offline + prompt=consent para garantir o refresh_token.
     */
    public function connect(): RedirectResponse
    {
        return Socialite::driver('google')
            ->scopes(['https://www.googleapis.com/auth/calendar.events'])
            ->with([
                'access_type' => 'offline',
                'prompt'      => 'consent', // força refresh_token mesmo se já autorizado
            ])
            ->redirectUrl(route('google.calendar.callback'))
            ->redirect();
    }

    /**
     * Callback do Google após autorização.
     * Salva os tokens e ativa a integração para o usuário autenticado.
     */
    public function callback(Request $request): RedirectResponse
    {
        if ($request->has('error')) {
            return redirect()->route('settings.index')
                ->with('error', 'Autorização cancelada. O Google Calendar não foi conectado.');
        }

        try {
            // Usa stateless + redirectUrl explícito para evitar mismatch em ambientes com proxy/ngrok
            $googleUser = Socialite::driver('google')
                ->redirectUrl(route('google.calendar.callback'))
                ->stateless()
                ->user();

            /** @var \App\Models\User $user */
            $user = auth()->user();

            $user->update([
                'google_calendar_token'   => json_encode([
                    'access_token'  => $googleUser->token,
                    'refresh_token' => $googleUser->refreshToken ?? '',
                    'expires_in'    => $googleUser->expiresIn ?? 3600,
                    'created'       => now()->timestamp,
                ]),
                'google_calendar_enabled' => true,
            ]);

            Log::info('GoogleCalendarController: Calendar conectado', [
                'user_id'          => $user->id,
                'has_refresh_token' => ! empty($googleUser->refreshToken),
            ]);

            return redirect()->route('settings.index')
                ->with('success', 'Google Calendar conectado! Seus lançamentos pendentes aparecerão na agenda.');
        } catch (\Throwable $e) {
            Log::error('GoogleCalendarController: falha no callback', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('settings.index')
                ->with('error', 'Falha ao conectar o Google Calendar: ' . $e->getMessage());
        }
    }

    /**
     * Remove o token e desativa a integração.
     */
    public function disconnect(): RedirectResponse
    {
        auth()->user()->update([
            'google_calendar_token'   => null,
            'google_calendar_enabled' => false,
        ]);

        return redirect()->route('settings.index')
            ->with('success', 'Google Calendar desconectado com sucesso.');
    }
}
