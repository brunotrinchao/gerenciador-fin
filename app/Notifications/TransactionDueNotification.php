<?php

namespace App\Notifications;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class TransactionDueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Transaction $transaction,
        public int $daysLeft
    ) {}

    public function via(object $notifiable): array
    {
        return ['broadcast', 'database'];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        $term = $this->daysLeft === 1 ? 'vence amanhã' : 'vence em 2 dias';
        if ($this->daysLeft < 0) $term = 'está vencida';

        return new BroadcastMessage([
            'transaction_id' => $this->transaction->id,
            'description' => "Atenção: '{$this->transaction->description}' {$term}!",
            'amount' => (float) $this->transaction->amount,
            'days_left' => $this->daysLeft,
            'type' => 'due_alert',
        ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'transaction_id' => $this->transaction->id,
            'description' => $this->transaction->description,
            'days_left' => $this->daysLeft,
        ];
    }
}
