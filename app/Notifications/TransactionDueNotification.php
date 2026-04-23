<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class TransactionDueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $description,
        public float $amount,
        public int $daysLeft,
        public string $itemType, // 'transaction', 'installment', 'invoice'
        public int $itemId
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
            'item_id' => $this->itemId,
            'description' => "Atenção: '{$this->description}' {$term}!",
            'amount' => $this->amount,
            'days_left' => $this->daysLeft,
            'item_type' => $this->itemType,
            'type' => 'due_alert',
        ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'item_id' => $this->itemId,
            'description' => $this->description,
            'amount' => $this->amount,
            'days_left' => $this->daysLeft,
            'item_type' => $this->itemType,
        ];
    }
}
