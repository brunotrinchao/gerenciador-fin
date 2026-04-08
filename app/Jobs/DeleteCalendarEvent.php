<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\GoogleCalendarService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DeleteCalendarEvent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 30;

    public function __construct(
        public readonly string $eventId,
        public readonly int    $userId,
    ) {}

    public function handle(GoogleCalendarService $calendarService): void
    {
        /** @var \App\Models\User|null $user */
        $user = User::find($this->userId);

        if (! $user || ! $user->google_calendar_token) {
            return;
        }

        try {
            $calendarService->deleteEvent($user, $this->eventId);
        } catch (\Throwable $e) {
            Log::warning('DeleteCalendarEvent: falha ao deletar evento', [
                'eventId' => $this->eventId,
                'error'   => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('DeleteCalendarEvent: job falhou após todas as tentativas', [
            'eventId' => $this->eventId,
            'error'   => $exception->getMessage(),
        ]);
    }
}
