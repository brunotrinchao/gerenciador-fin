<?php

namespace App\Services;

use App\Enums\InstallmentStatus;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Jobs\CreateCalendarEvent;
use App\Models\CreditCard;
use App\Models\Installment;
use App\Models\InstallmentGroup;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class InstallmentService
{
    public function create(array $data): InstallmentGroup
    {
        
        // Aceita 'amount' (via TransactionController) ou 'total_amount' (via InstallmentGroupController/testes)
        $totalAmount       = (float) ($data['total_amount'] ?? $data['amount'] ?? 0);
        $n                 = (int) $data['total_installments'];
        $installmentAmount = round($totalAmount / $n, 2);
        // Diferença de arredondamento vai na última parcela
        $lastAmount        = round($totalAmount - ($installmentAmount * ($n - 1)), 2);

        $user  = User::find($data['user_id']);

        $group = InstallmentGroup::create([
            'user_id'            => $data['user_id'],
            'credit_card_id'     => $data['credit_card_id'] ?? null,
            'bank_account_id'    => $data['bank_account_id'] ?? null,
            'category_id'        => $data['category_id'] ?? null,
            'description'        => $data['description'],
            'total_amount'       => $totalAmount,
            'installment_amount' => $installmentAmount,
            'total_installments' => $n,
            'paid_installments'  => 0,
            'start_date'         => $data['start_date'],
            'status'             => InstallmentStatus::Active,
        ]);

        $baseDate = Carbon::parse($data['start_date']);

        $txType = ! empty($data['credit_card_id'])
            ? TransactionType::CreditCard
            : TransactionType::Expense;

        for ($i = 1; $i <= $n; $i++) {
            $amount = ($i === $n) ? $lastAmount : $installmentAmount;

            // addMonthsNoOverflow evita overflow (ex: jan/31 + 1 mês = fev/28, não mar/03)
            $dueDate = $baseDate->copy()->addMonthsNoOverflow($i - 1);
            
            // Pula final de semana: se sábado ou domingo, vai para segunda-feira
            $dueDate = $this->adjustForWeekend($dueDate);

            $transaction = Transaction::create([
                'user_id'              => $data['user_id'],
                'bank_account_id'      => $data['bank_account_id'] ?? null,
                'credit_card_id'       => $data['credit_card_id'] ?? null,
                'category_id'          => $data['category_id'] ?? null,
                'installment_group_id' => $group->id,
                'description'          => $data['description'] . " ({$i}/{$n})",
                'amount'               => $amount,
                'type'                 => $txType,
                'status'               => TransactionStatus::Pending,
                'date'                 => $dueDate->format('Y-m-d'),
            ]);

            $installment = Installment::create([
                'installment_group_id' => $group->id,
                'transaction_id'       => $transaction->id,
                'number'               => $i,
                'amount'               => $amount,
                'due_date'             => $dueDate->format('Y-m-d'),
                'status'               => TransactionStatus::Pending,
            ]);

            // Sincronização Google Calendar agora via InstallmentObserver
        }

        return $group;
    }

    private function adjustForWeekend(Carbon $date): Carbon
    {
        if ($date->isWeekend()) {
            return $date->next(Carbon::MONDAY);
        }
        return $date;
    }

    /**
     * Update installment transactions based on scope.
     *
     * @param Transaction $transaction
     * @param array $data
     * @param string $scope  'only_this' | 'this_and_future' | 'all'
     */
    public function updateSeries(Transaction $transaction, array $data, string $scope): void
    {
        $groupId = $transaction->installment_group_id;
        if (!$groupId) return;

        $targets = $this->resolveTargets($transaction, $scope);

        DB::transaction(function () use ($targets, $transaction, $data, $scope, $groupId) {
            foreach ($targets as $target) {
                $update = $data;
                
                // Do not sync date/due_date in bulk
                unset($update['date']);
                
                // Only update if not paid (protection)
                if ($scope !== 'only_this' && $target->status === TransactionStatus::Paid) {
                    continue;
                }

                $target->update($update);

                // Sync with Installment model if it exists
                $installment = Installment::where('transaction_id', $target->id)->first();
                if ($installment) {
                    $instUpdate = [];
                    if (isset($update['amount'])) $instUpdate['amount'] = $update['amount'];
                    if (isset($update['status'])) $instUpdate['status'] = $update['status'];
                    if (!empty($instUpdate)) {
                        $installment->update($instUpdate);
                    }
                }
            }

            // Recalculate group total if amount changed
            if (isset($data['amount'])) {
                $group = InstallmentGroup::find($groupId);
                if ($group) {
                    $group->update([
                        'total_amount' => Installment::where('installment_group_id', $groupId)->sum('amount')
                    ]);
                }
            }
        });
    }

    /**
     * Delete installment transactions based on scope.
     *
     * @param Transaction $transaction
     * @param string $scope  'only_this' | 'this_and_future' | 'all'
     */
    public function deleteSeries(Transaction $transaction, string $scope): void
    {
        $groupId = $transaction->installment_group_id;
        if (!$groupId) return;

        $targets = $this->resolveTargets($transaction, $scope);

        DB::transaction(function () use ($targets, $groupId) {
            foreach ($targets as $target) {
                // Delete Installment first to satisfy FK if needed
                Installment::where('transaction_id', $target->id)->delete();

                // Dissocia do grupo antes de deletar para evitar cascatas indesejadas
                $target->update(['installment_group_id' => null]);

                // forceDelete garante remoção física; o observer 'deleted' ainda é disparado
                // internamente pelo SoftDeletes, recalculando saldo/limite corretamente
                $target->forceDelete();
            }

            // Se todas as parcelas foram removidas, remove o grupo também
            $remaining = Installment::where('installment_group_id', $groupId)->count();
            if ($remaining === 0) {
                InstallmentGroup::find($groupId)?->forceDelete();
            } else {
                // Update total amount and count
                $group = InstallmentGroup::find($groupId);
                if ($group) {
                    $group->update([
                        'total_installments' => $remaining,
                        'total_amount'       => Installment::where('installment_group_id', $groupId)->sum('amount')
                    ]);
                }
            }
        });
    }

    private function resolveTargets(Transaction $transaction, string $scope): \Illuminate\Support\Collection
    {
        if ($scope === 'only_this') {
            return collect([$transaction]);
        }

        $groupId = $transaction->installment_group_id;
        $currentInstallment = Installment::where('transaction_id', $transaction->id)->first();
        
        if (!$currentInstallment) return collect([$transaction]);

        $query = Transaction::where('installment_group_id', $groupId);

        if ($scope === 'all') {
            return $query->get();
        }

        // 'this_and_future'
        $futureTransactionIds = Installment::where('installment_group_id', $groupId)
            ->where('number', '>=', $currentInstallment->number)
            ->pluck('transaction_id');

        return Transaction::whereIn('id', $futureTransactionIds)->get();
    }
}
