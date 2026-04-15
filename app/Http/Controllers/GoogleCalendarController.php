<?php

namespace App\Http\Controllers;

use App\Models\CreditCardStatement;
use App\Models\Installment;
use App\Models\Transaction;
use App\Services\GoogleCalendarService;
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
     * Se remove_events=true, deleta todos os eventos criados antes de apagar o token.
     */
    public function disconnect(Request $request, GoogleCalendarService $calendarService): RedirectResponse
    {
        $removeEvents = $request->boolean('remove_events', false);
        $user         = auth()->user();
        $userId       = auth()->id();

        if ($removeEvents && $user->google_calendar_enabled) {
            $this->performClearEvents($userId, $user, $calendarService);
        }

        $user->update([
            'google_calendar_token'   => null,
            'google_calendar_enabled' => false,
        ]);

        $message = $removeEvents
            ? 'Google Calendar desconectado e eventos removidos da agenda.'
            : 'Google Calendar desconectado com sucesso.';

        return redirect()->route('settings.index')->with('success', $message);
    }

    /**
     * Limpa todos os eventos da agenda sem desconectar.
     */
    public function clearEvents(GoogleCalendarService $calendarService): RedirectResponse
    {
        $user   = auth()->user();
        $userId = auth()->id();

        if (! $user->google_calendar_enabled) {
            return redirect()->route('settings.index')
                ->with('error', 'Google Calendar não está habilitado.');
        }

        try {
            $this->performClearEvents($userId, $user, $calendarService);

            return redirect()->route('settings.index')
                ->with('success', 'Eventos removidos da sua Google Agenda com sucesso.');
        } catch (\Throwable $e) {
            Log::error('GoogleCalendarController: falha ao limpar eventos', [
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('settings.index')
                ->with('error', 'Falha ao limpar eventos: ' . $e->getMessage());
        }
    }

    /**
     * Executa a limpeza física dos eventos no Google e lógica no BD.
     */
    private function performClearEvents(int $userId, $user, GoogleCalendarService $calendarService): void
    {
        Transaction::byUser($userId)
            ->whereNotNull('google_event_id')
            ->get(['id', 'google_event_id'])
            ->each(function (Transaction $t) use ($user, $calendarService) {
                $calendarService->deleteEvent($user, $t->google_event_id);
                $t->withoutEvents(fn () => $t->update(['google_event_id' => null]));
            });

        Installment::whereHas('group', fn ($q) => $q->where('user_id', $userId))
            ->whereNotNull('google_event_id')
            ->get(['id', 'google_event_id'])
            ->each(function (Installment $i) use ($user, $calendarService) {
                $calendarService->deleteEvent($user, $i->google_event_id);
                $i->withoutEvents(fn () => $i->update(['google_event_id' => null]));
            });

        CreditCardStatement::where('user_id', $userId)
            ->whereNotNull('google_event_id')
            ->get(['id', 'google_event_id'])
            ->each(function (CreditCardStatement $s) use ($user, $calendarService) {
                $calendarService->deleteEvent($user, $s->google_event_id);
                $s->update(['google_event_id' => null]);
            });
    }
}
