<?php

namespace App\Jobs;

use App\Models\CreditCardStatement;
use App\Models\Installment;
use App\Models\Transaction;
use App\Models\User;
use App\Services\GoogleCalendarService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CreateCalendarEvent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 30;

    public function __construct(
        public readonly string $modelClass,
        public readonly int    $modelId,
        public readonly int    $userId,
    ) {}

    public function handle(GoogleCalendarService $calendarService): void
    {
        /** @var \App\Models\User|null $user */
        $user = User::find($this->userId);

        if (! $user || ! $user->google_calendar_enabled || ! $user->google_calendar_token) {
            return;
        }

        $model = $this->modelClass::find($this->modelId);

        if (! $model) {
            return;
        }

        // Evita duplicata: se já tem eventId, não cria novamente
        if (! empty($model->google_event_id)) {
            return;
        }

        try {
            $payload = match ($this->modelClass) {
                Transaction::class          => $calendarService->buildTransactionPayload($model),
                Installment::class          => $calendarService->buildInstallmentPayload($model->load('group.category')),
                CreditCardStatement::class  => $calendarService->buildStatementPayload($model->load('creditCard')),
                default                     => null,
            };

            if (! $payload) {
                return;
            }

            $eventId = $calendarService->createEvent($user, $payload);

            if ($eventId) {
                $model->update(['google_event_id' => $eventId]);
            }
        } catch (\Throwable $e) {
            Log::warning('CreateCalendarEvent: falha ao criar evento', [
                'model'   => $this->modelClass,
                'modelId' => $this->modelId,
                'error'   => $e->getMessage(),
            ]);
            throw $e; // Permite retry pelo queue
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('CreateCalendarEvent: job falhou após todas as tentativas', [
            'model'   => $this->modelClass,
            'modelId' => $this->modelId,
            'error'   => $exception->getMessage(),
        ]);
    }
}
