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
        public string $description = '',
        public float $amount = 0,
        public int $daysLeft = 0,
        public string $itemType = 'transaction',
        public int $itemId = 0
    ) {}

    public function via(object $notifiable): array
    {
        return ['broadcast', 'database'];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        $icons = [
            'transaction' => '💰',
            'installment' => '📄',
            'invoice'     => '💳',
        ];

        $icon = $icons[$this->itemType] ?? '⚠️';
        $term = $this->daysLeft === 1 ? 'vence amanhã' : "vence em {$this->daysLeft} dias";
        if ($this->daysLeft < 0) $term = 'está vencida';

        $formattedAmount = 'R$ ' . number_format($this->amount, 2, ',', '.');

        return new BroadcastMessage([
            'item_id'     => $this->itemId,
            'title'       => "{$icon} Lembrete de Vencimento",
            'description' => "O item '{$this->description}' {$term}. Valor: {$formattedAmount}",
            'amount'      => $this->amount,
            'days_left'   => $this->daysLeft,
            'item_type'   => $this->itemType,
            'type'        => 'due_alert',
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
