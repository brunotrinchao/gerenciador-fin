<?php

namespace App\Services;

use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class RecurringTransactionService
{
    /**
     * Create recurring child transactions for the next 12 months based on recurrence_rule.
     * The $parent is the first occurrence (already created). This creates the subsequent ones.
     */
    public function createSeries(Transaction $parent, array $data): Collection
    {
        $created = collect();

        $rule        = $parent->recurrence_rule;
        $endDate     = $parent->recurrence_end_date ? Carbon::parse($parent->recurrence_end_date) : null;
        $maxOccurrences = $parent->recurrence_occurrences ?? null;
        $limit       = Carbon::parse($parent->date)->addMonths(12);

        $current = Carbon::parse($parent->date);
        $count   = 1; // parent counts as first occurrence

        while (true) {
            $current = $this->nextDate($current, $rule);

            if ($endDate && $current->gt($endDate)) break;
            if ($current->gt($limit)) break;
            if ($maxOccurrences && $count >= $maxOccurrences) break;

            $child = Transaction::create([
                'user_id'                 => $parent->user_id,
                'bank_account_id'         => $parent->bank_account_id,
                'credit_card_id'          => $parent->credit_card_id,
                'category_id'             => $parent->category_id,
                'installment_group_id'    => $parent->installment_group_id,
                'parent_transaction_id'   => $parent->id,
                'description'             => $parent->description,
                'amount'                  => $parent->amount,
                'type'                    => $parent->type,
                'status'                  => 'pending',
                'date'                    => $current->format('Y-m-d'),
                'competence_date'         => $current->format('Y-m-d'),
                'notes'                   => $parent->notes,
                'is_recurring'            => true,
                'recurrence_rule'         => $rule,
                'recurrence_end_date'     => $parent->recurrence_end_date,
                'recurrence_occurrences'  => $parent->recurrence_occurrences,
            ]);

            $created->push($child);
            $count++;
        }

        return $created;
    }

    /**
     * Update recurring transactions based on scope.
     *
     * @param string $scope  'only_this' | 'this_and_future' | 'all'
     */
    public function updateSeries(Transaction $transaction, array $data, string $scope): void
    {
        $targets = $this->resolveTargets($transaction, $scope);

        foreach ($targets as $target) {
            $update = $data;
            // Preserve individual date for each occurrence when scope is not 'only_this'
            if ($scope !== 'only_this') {
                unset($update['date']);
            }
            $target->update($update);
        }
    }

    /**
     * Delete recurring transactions based on scope.
     *
     * @param string $scope  'only_this' | 'this_and_future' | 'all'
     */
    public function deleteSeries(Transaction $transaction, string $scope): void
    {
        $targets = $this->resolveTargets($transaction, $scope);

        foreach ($targets as $target) {
            $target->delete();
        }
    }

    private function resolveTargets(Transaction $transaction, string $scope): Collection
    {
        if ($scope === 'only_this') {
            return collect([$transaction]);
        }

        // Determine the root parent id
        $rootId = $transaction->parent_transaction_id ?? $transaction->id;

        if ($scope === 'all') {
            // Root itself + all children
            $children = Transaction::where('parent_transaction_id', $rootId)->get();
            $root     = Transaction::find($rootId);
            return $root ? $children->prepend($root) : $children;
        }

        // 'this_and_future'
        if ($transaction->parent_transaction_id === null) {
            // This IS the root: root + all children
            $children = Transaction::where('parent_transaction_id', $transaction->id)->get();
            return $children->prepend($transaction);
        }

        // This is a child: itself + siblings with date >= this date
        $siblings = Transaction::where('parent_transaction_id', $rootId)
            ->where('date', '>=', $transaction->date)
            ->get();

        // Also include root if it has same or later date
        $root = Transaction::find($rootId);
        if ($root && $root->date >= $transaction->date) {
            $siblings->prepend($root);
        }

        return $siblings->contains('id', $transaction->id)
            ? $siblings
            : $siblings->prepend($transaction);
    }

    private function nextDate(Carbon $date, string $rule): Carbon
    {
        return match ($rule) {
            'weekly'     => $date->copy()->addDays(7),
            'biweekly'   => $date->copy()->addDays(14),
            'bimonthly'  => $date->copy()->addMonths(2),
            'quarterly'  => $date->copy()->addMonths(3),
            'semiannual' => $date->copy()->addMonths(6),
            'annual'     => $date->copy()->addMonths(12),
            default      => $date->copy()->addMonths(1), // monthly
        };
    }
}
