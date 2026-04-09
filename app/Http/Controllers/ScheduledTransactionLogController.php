<?php

namespace App\Http\Controllers;

use App\Models\ScheduledTransactionLog;
use App\Models\Transaction;
use Inertia\Inertia;
use Inertia\Response;

class ScheduledTransactionLogController extends Controller
{
    public function index(): Response
    {
        $logs = ScheduledTransactionLog::orderByDesc('processed_at')
            ->paginate(20);

        $allIds = $logs->getCollection()
            ->flatMap(fn ($log) => $log->processed_transaction_ids ?? [])
            ->unique()
            ->values();

        $transactions = Transaction::whereIn('id', $allIds)
            ->with(['category', 'bankAccount'])
            ->get()
            ->values();

        return Inertia::render('ScheduledLogs/Index', [
            'logs'         => $logs,
            'transactions' => $transactions,
        ]);
    }
}
