<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    private const API_BASE     = 'https://www.googleapis.com/calendar/v3';
    private const TOKEN_URL    = 'https://oauth2.googleapis.com/token';
    private const CALENDAR_ID  = 'primary';

    // colorId do Google Calendar por tipo de lançamento
    private const COLOR_EXPENSE     = '11'; // Tomato (vermelho)
    private const COLOR_INCOME      = '2';  // Sage (verde claro)
    private const COLOR_CREDIT_CARD = '7';  // Peacock (azul petróleo)
    private const COLOR_BOLETO      = '5';  // Banana (amarelo)
    private const COLOR_INSTALLMENT = '9';  // Blueberry (azul)
    private const COLOR_INVOICE     = '7';  // Peacock (azul petróleo)

    /**
     * Cria um evento no Google Calendar e retorna o eventId.
     * Retorna null se falhar silenciosamente.
     */
    public function createEvent(User $user, array $payload): ?string
    {
        $user = $this->refreshTokenIfNeeded($user);

        if (! $user->google_calendar_enabled || ! $user->google_calendar_token) {
            return null;
        }

        $token = json_decode($user->google_calendar_token, true);

        try {
            $response = Http::withToken($token['access_token'])
                ->timeout(10)
                ->post(self::API_BASE . '/calendars/' . self::CALENDAR_ID . '/events', $payload);

            if ($response->successful()) {
                return $response->json('id');
            }

            Log::warning('GoogleCalendarService: falha ao criar evento', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('GoogleCalendarService: exceção ao criar evento', ['error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Deleta um evento do Google Calendar.
     */
    public function deleteEvent(User $user, string $eventId): void
    {
        $user = $this->refreshTokenIfNeeded($user);

        if (! $user->google_calendar_token) {
            return;
        }

        $token = json_decode($user->google_calendar_token, true);

        try {
            Http::withToken($token['access_token'])
                ->timeout(10)
                ->delete(self::API_BASE . '/calendars/' . self::CALENDAR_ID . '/events/' . $eventId);
        } catch (\Throwable $e) {
            Log::warning('GoogleCalendarService: exceção ao deletar evento', [
                'eventId' => $eventId,
                'error'   => $e->getMessage(),
            ]);
        }
    }

    /**
     * Verifica se o token expirou e renova via refresh_token se necessário.
     */
    public function refreshTokenIfNeeded(User $user): User
    {
        if (! $user->google_calendar_token) {
            return $user;
        }

        $token = json_decode($user->google_calendar_token, true);

        $expiresAt = ($token['created'] ?? 0) + ($token['expires_in'] ?? 3600) - 60;
        if (now()->timestamp < $expiresAt) {
            return $user; // Token ainda válido
        }

        if (empty($token['refresh_token'])) {
            return $user; // Sem refresh token, não é possível renovar
        }

        try {
            $response = Http::asForm()->post(self::TOKEN_URL, [
                'client_id'     => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'refresh_token' => $token['refresh_token'],
                'grant_type'    => 'refresh_token',
            ]);

            if ($response->successful()) {
                $newToken = $response->json();
                $merged   = array_merge($token, [
                    'access_token' => $newToken['access_token'],
                    'expires_in'   => $newToken['expires_in'] ?? 3600,
                    'created'      => now()->timestamp,
                ]);

                $user->update(['google_calendar_token' => json_encode($merged)]);
                $user->refresh();
            }
        } catch (\Throwable $e) {
            Log::warning('GoogleCalendarService: falha ao renovar token', ['error' => $e->getMessage()]);
        }

        return $user;
    }

    // ─────────────────────────────────────────────
    // Builders de payload por tipo de lançamento
    // ─────────────────────────────────────────────

    public function buildTransactionPayload(\App\Models\Transaction $tx): array
    {
        $emoji = match ($tx->type->value ?? $tx->type) {
            'income'       => '💰',
            'expense'      => '💸',
            'credit_card'  => '💳',
            'transfer'     => '↔️',
            'investment_in'  => '📈',
            'investment_out' => '📉',
            default        => '📌',
        };

        $colorId = match ($tx->type->value ?? $tx->type) {
            'income'      => self::COLOR_INCOME,
            'credit_card' => self::COLOR_CREDIT_CARD,
            default       => self::COLOR_EXPENSE,
        };

        $amount      = number_format((float) $tx->amount, 2, ',', '.');
        $category    = $tx->category?->name ?? 'Sem categoria';
        $account     = $tx->bankAccount?->name ?? $tx->creditCard?->name ?? '';
        $description = "Valor: R$ {$amount}\nCategoria: {$category}" . ($account ? "\nConta: {$account}" : '');

        return $this->buildEventPayload(
            title:       "{$emoji} {$tx->description} | R$ {$amount}",
            date:        $tx->date instanceof \Carbon\Carbon ? $tx->date->format('Y-m-d') : substr($tx->date, 0, 10),
            description: $description,
            colorId:     $colorId,
        );
    }

    public function buildInstallmentPayload(\App\Models\Installment $installment): array
    {
        $group  = $installment->group;
        $amount = number_format((float) $installment->amount, 2, ',', '.');
        $num    = "{$installment->number}/{$group?->total_installments}";
        $cat    = $group?->category?->name ?? 'Sem categoria';

        return $this->buildEventPayload(
            title:       "💳 {$group?->description} ({$num}) | R$ {$amount}",
            date:        $installment->due_date instanceof \Carbon\Carbon
                             ? $installment->due_date->format('Y-m-d')
                             : substr($installment->due_date, 0, 10),
            description: "Valor: R$ {$amount}\nParcela: {$num}\nCategoria: {$cat}",
            colorId:     self::COLOR_INSTALLMENT,
        );
    }

    public function buildStatementPayload(\App\Models\CreditCardStatement $statement): array
    {
        $amount  = number_format((float) $statement->total_amount, 2, ',', '.');
        $card    = $statement->creditCard?->name ?? 'Cartão';
        $dueDate = $statement->due_date instanceof \Carbon\Carbon
            ? $statement->due_date->format('Y-m-d')
            : substr($statement->due_date, 0, 10);

        return $this->buildEventPayload(
            title:       "💳 Fatura {$card} {$statement->reference_month} | R$ {$amount}",
            date:        $dueDate,
            description: "Valor: R$ {$amount}\nCartão: {$card}\nMês de referência: {$statement->reference_month}",
            colorId:     self::COLOR_INVOICE,
        );
    }

    // ─────────────────────────────────────────────
    // Payload base (all-day event)
    // ─────────────────────────────────────────────

    private function buildEventPayload(string $title, string $date, string $description, string $colorId): array
    {
        return [
            'summary'     => $title,
            'description' => $description,
            'colorId'     => $colorId,
            'start'       => ['date' => $date],
            'end'         => ['date' => $date],
            'reminders'   => [
                'useDefault' => false,
                'overrides'  => [
                    ['method' => 'popup', 'minutes' => 60 * 9], // 9h antes (às 9h do dia)
                ],
            ],
        ];
    }
}
