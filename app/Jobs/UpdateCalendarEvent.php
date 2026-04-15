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

class UpdateCalendarEvent implements ShouldQueue
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

        if (! $model || empty($model->google_event_id)) {
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

            $calendarService->updateEvent($user, $model->google_event_id, $payload);

        } catch (\Throwable $e) {
            Log::warning('UpdateCalendarEvent: falha ao atualizar evento', [
                'model'   => $this->modelClass,
                'modelId' => $this->modelId,
                'error'   => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('UpdateCalendarEvent: job falhou após todas as tentativas', [
            'model'   => $this->modelClass,
            'modelId' => $this->modelId,
            'error'   => $exception->getMessage(),
        ]);
    }
}
