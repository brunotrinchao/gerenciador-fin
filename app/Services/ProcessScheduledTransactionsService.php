<?php

namespace App\Services;

use App\Models\ScheduledTransactionLog;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;

class ProcessScheduledTransactionsService
{
    public function process(): ScheduledTransactionLog
    {
        $startTime = microtime(true);
        $processedAt = now();

        $transactions = Transaction::scheduled()
            ->where('date', '<=', today())
            ->with(['bankAccount', 'user'])
            ->get();

        $processedIds = [];
        $failedIds    = [];

        foreach ($transactions as $transaction) {
            try {
                $transaction->markAsPaid();
                $processedIds[] = $transaction->id;
            } catch (\Throwable $e) {
                $failedIds[] = $transaction->id;
                Log::error('Falha ao processar transação agendada', [
                    'transaction_id' => $transaction->id,
                    'user_id'        => $transaction->user_id,
                    'error'          => $e->getMessage(),
                ]);
            }
        }

        $executionMs = (int) round((microtime(true) - $startTime) * 1000);

        return ScheduledTransactionLog::create([
            'processed_at'              => $processedAt,
            'transactions_count'        => count($processedIds),
            'failed_count'              => count($failedIds),
            'processed_transaction_ids' => $processedIds,
            'failed_transaction_ids'    => $failedIds,
            'execution_ms'              => max(0, $executionMs),
        ]);
    }
}
