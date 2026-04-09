<?php

namespace App\Console\Commands;

use App\Models\Transaction;
use App\Services\ProcessScheduledTransactionsService;
use Illuminate\Console\Command;

class ProcessScheduledTransactionsCommand extends Command
{
    protected $signature   = 'transactions:process-scheduled {--dry-run : Simula sem salvar alterações}';
    protected $description = 'Processa transações agendadas com vencimento até hoje';

    public function handle(ProcessScheduledTransactionsService $service): int
    {
        if ($this->option('dry-run')) {
            $count = Transaction::scheduled()->where('date', '<=', today())->count();
            $this->info("Dry-run: {$count} transação(ões) seriam processadas.");
            return self::SUCCESS;
        }

        $log = $service->process();

        $this->info("Processadas: {$log->transactions_count}");
        $this->info("Tempo: {$log->execution_ms}ms");

        if ($log->failed_count > 0) {
            $this->warn("Falhas: {$log->failed_count} - verifique os logs do Laravel.");
        }

        return self::SUCCESS;
    }
}
