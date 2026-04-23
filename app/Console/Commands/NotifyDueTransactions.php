<?php

namespace App\Console\Commands;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
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
        
        // Vencendo amanhã (1 dia)
        $dueInOneDay = $today->copy()->addDay();
        // Vencendo em 2 dias
        $dueInTwoDays = $today->copy()->addDays(2);

        $this->info("Verificando transações para {$dueInOneDay->toDateString()} e {$dueInTwoDays->toDateString()}...");

        Transaction::with('user')
            ->where('status', TransactionStatus::Pending->value)
            ->whereIn('date', [$dueInOneDay, $dueInTwoDays])
            ->each(function (Transaction $tx) use ($dueInOneDay) {
                if ($tx->user) {
                    $daysLeft = $tx->date->isSameDay($dueInOneDay) ? 1 : 2;
                    $tx->user->notify(new TransactionDueNotification($tx, $daysLeft));
                    $this->line("Notificação enviada para: {$tx->user->email} - Transação: {$tx->description}");
                }
            });

        $this->info("Concluído.");
    }
}
