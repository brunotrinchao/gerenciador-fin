<?php

namespace App\Console\Commands;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Models\Notification as AppNotification;
use App\Notifications\TransactionDueNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class NotifyDueTransactions extends Command
{
    protected $signature = 'app:notify-due-transactions';
    protected $description = 'Notifica usuários sobre transações vencendo em 1 ou 2 dias';

    public function handle()
    {
        $today = Carbon::today();
        $dueInOneDay = $today->copy()->addDay();
        $dueInTwoDays = $today->copy()->addDays(2);
        $targetDates = [$dueInOneDay, $dueInTwoDays];

        $this->info("Verificando pendências para {$dueInOneDay->toDateString()} e {$dueInTwoDays->toDateString()}...");

        // 1. Transações simples (não CC, não parceladas)
        \App\Models\Transaction::with('user')
            ->whereIn('status', [TransactionStatus::Pending->value, TransactionStatus::Scheduled->value])
            ->whereNotIn('type', [\App\Enums\TransactionType::CreditCard->value])
            ->whereNull('installment_group_id')
            ->whereIn('date', $targetDates)
            ->each(function (Transaction $tx) use ($dueInOneDay) {
                $daysLeft = $tx->date->isSameDay($dueInOneDay) ? 1 : 2;
                $tx->user->notify(new TransactionDueNotification($tx->description, (float) $tx->amount, $daysLeft, 'transaction', $tx->id));
                
                $this->saveToAppNotifications($tx->user_id, 'transaction', $tx->id, $tx->description, (float) $tx->amount, $daysLeft);
                $this->line("Notificação: Transação {$tx->description}");
            });

        // 2. Parcelas (não CC)
        \App\Models\Installment::where('status', TransactionStatus::Pending->value)
            ->whereHas('group', fn ($q) => $q->whereNull('credit_card_id'))
            ->whereIn('due_date', $targetDates)
            ->with('group.user')
            ->each(function (\App\Models\Installment $inst) use ($dueInOneDay) {
                $user = $inst->group->user;
                if ($user) {
                    $daysLeft = $inst->due_date->isSameDay($dueInOneDay) ? 1 : 2;
                    $desc = $inst->group->description . " ({$inst->number}/{$inst->group->total_installments})";
                    $user->notify(new TransactionDueNotification($desc, (float) $inst->amount, $daysLeft, 'installment', $inst->id));
                    
                    $this->saveToAppNotifications($user->id, 'installment', $inst->id, $desc, (float) $inst->amount, $daysLeft);
                    $this->line("Notificação: Parcela {$desc}");
                }
            });

        // 3. Faturas (CreditCardStatement)
        \App\Models\CreditCardStatement::where('status', 'open')
            ->whereIn('due_date', $targetDates)
            ->with(['user', 'creditCard'])
            ->each(function (\App\Models\CreditCardStatement $stmt) use ($dueInOneDay) {
                if ($stmt->user) {
                    $daysLeft = $stmt->due_date->isSameDay($dueInOneDay) ? 1 : 2;
                    $desc = "Fatura " . ($stmt->creditCard?->name ?? 'Cartão') . " - " . $stmt->reference_month;
                    $stmt->user->notify(new TransactionDueNotification($desc, (float) $stmt->total_amount, $daysLeft, 'invoice', $stmt->id));
                    
                    $this->saveToAppNotifications($stmt->user_id, 'invoice', $stmt->id, $desc, (float) $stmt->total_amount, $daysLeft);
                    $this->line("Notificação: Fatura {$desc}");
                }
            });

        $this->info("Concluído.");
    }

    private function saveToAppNotifications(int $userId, string $type, int $id, string $desc, float $amount, int $daysLeft)
    {
        $icons = [
            'transaction' => '💰',
            'installment' => '📄',
            'invoice'     => '💳',
        ];

        $icon = $icons[$type] ?? '⚠️';
        $term = $daysLeft === 1 ? 'vence amanhã' : "vence em {$daysLeft} dias";
        $formattedAmount = 'R$ ' . number_format($amount, 2, ',', '.');

        AppNotification::create([
            'user_id' => $userId,
            'type'    => 'due_alert',
            'title'   => "{$icon} Lembrete de Pagamento",
            'message' => "O item '{$desc}' {$term}. Valor: {$formattedAmount}",
            'data'    => [
                'item_id'   => $id,
                'item_type' => $type,
                'amount'    => $amount,
                'days_left' => $daysLeft
            ],
        ]);
    }
}
