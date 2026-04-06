<?php

namespace App\Services\Import;

use App\Models\Transaction;
use Illuminate\Support\Collection;

class DuplicateDetector
{
    /**
     * Detecta duplicatas nos itens importados comparando com transações existentes.
     * Marca cada item com status_import: 'new', 'duplicate_exact' ou 'duplicate_fuzzy'
     */
    public function detect(int $userId, Collection $items): Collection
    {
        // Carregar hashes existentes do usuário para comparação rápida
        $existingHashes = Transaction::where('user_id', $userId)
            ->whereNotNull('import_hash')
            ->pluck('import_hash')
            ->flip(); // Transforma em chave para lookup O(1)

        // Carregar transações recentes para fuzzy match (últimos 60 dias)
        $recentTransactions = Transaction::where('user_id', $userId)
            ->where('date', '>=', now()->subDays(180)->toDateString())
            ->get(['id', 'date', 'amount', 'description']);

        return $items->map(function (array $item) use ($existingHashes, $recentTransactions) {
            $amountCents = (int) round($item['amount'] * 100);
            $hash = Transaction::generateImportHash($item['date'], $amountCents, $item['description']);

            // 1. Duplicata exata por hash
            if (isset($existingHashes[$hash])) {
                $item['status_import'] = 'duplicate_exact';
                $item['import_hash']   = $hash;
                return $item;
            }

            // 2. Fuzzy: mesmo valor + data ±3 dias + descrição similar
            $itemDate   = \Carbon\Carbon::parse($item['date']);
            $itemAmount = $item['amount'];

            $fuzzy = $recentTransactions->first(function ($tx) use ($itemDate, $itemAmount) {
                $txDate = \Carbon\Carbon::parse($tx->date);
                $daysDiff = abs($itemDate->diffInDays($txDate));
                $amountDiff = abs(($tx->amount - $itemAmount) / max($itemAmount, 0.01));

                return $daysDiff <= 3 && $amountDiff < 0.05; // ±5% no valor
            });

            if ($fuzzy) {
                $item['status_import'] = 'duplicate_fuzzy';
                $item['import_hash']   = $hash;
                return $item;
            }

            $item['import_hash']   = $hash;
            $item['status_import'] = 'new';
            return $item;
        });
    }
}
