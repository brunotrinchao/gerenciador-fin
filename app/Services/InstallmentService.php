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

        $purchaseDate = Carbon::parse($data['start_date']);

        if (! empty($data['credit_card_id'])) {
            $card     = CreditCard::findOrFail($data['credit_card_id']);
            $firstDue = Carbon::instance($card->calculateDueDate($purchaseDate->toDateTime()));
        } else {
            // Débito direto: vence no mesmo dia do mês seguinte (sem overflow para meses curtos)
            $firstDue = $purchaseDate->copy()->addMonthNoOverflow();
        }

        $txType = ! empty($data['credit_card_id'])
            ? TransactionType::CreditCard
            : TransactionType::Expense;

        for ($i = 1; $i <= $n; $i++) {
            $amount = ($i === $n) ? $lastAmount : $installmentAmount;

            // addMonthsNoOverflow evita overflow (ex: jan/31 + 1 mês = fev/28, não mar/03)
            $dueDate = $firstDue->copy()->addMonthsNoOverflow($i - 1);

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

            // Cria evento no Google Calendar para cada parcela pendente
            if ($user?->google_calendar_enabled) {
                CreateCalendarEvent::dispatch(Installment::class, $installment->id, $data['user_id']);
            }
        }

        return $group;
    }

    public function updateSeries(Installment $installment, array $data, string $scope): void
    {
        $targets = $this->resolveTargets($installment, $scope);
        $group   = $installment->group;

        DB::transaction(function () use ($targets, $group, $data, $scope) {
            foreach ($targets as $target) {
                $targetUpdate = [];
                if (isset($data['amount'])) {
                    $targetUpdate['amount'] = $data['amount'];
                }
                if (isset($data['status'])) {
                    $targetUpdate['status'] = $data['status'];
                }

                if (! empty($targetUpdate)) {
                    $target->update($targetUpdate);
                }

                if ($target->transaction) {
                    $txData = [];
                    if (isset($data['description'])) {
                        $txData['description'] = $data['description'] . " ({$target->number}/{$group->total_installments})";
                    }
                    if (isset($data['amount'])) {
                        $txData['amount'] = $data['amount'];
                    }
                    if (array_key_exists('category_id', $data)) {
                        $txData['category_id'] = $data['category_id'];
                    }
                    if (array_key_exists('bank_account_id', $data)) {
                        $txData['bank_account_id'] = $data['bank_account_id'];
                    }
                    if (array_key_exists('notes', $data)) {
                        $txData['notes'] = $data['notes'];
                    }
                    if (isset($data['status'])) {
                        $txData['status'] = $data['status'];
                    }

                    if (! empty($txData)) {
                        $target->transaction->update($txData);
                    }
                }
            }

            if ($scope === 'all') {
                $groupUpdate = [];
                if (isset($data['description'])) {
                    $groupUpdate['description'] = $data['description'];
                }
                if (array_key_exists('category_id', $data)) {
                    $groupUpdate['category_id'] = $data['category_id'];
                }
                if (array_key_exists('bank_account_id', $data)) {
                    $groupUpdate['bank_account_id'] = $data['bank_account_id'];
                }
                if (isset($data['amount'])) {
                    $groupUpdate['installment_amount'] = $data['amount'];
                }

                if (! empty($groupUpdate)) {
                    $group->update($groupUpdate);
                }
            }

            // Recalcula o total do grupo
            $group->update([
                'total_amount' => $group->installments()->sum('amount'),
            ]);
        });
    }

    public function deleteSeries(Installment $installment, string $scope): void
    {
        if ($scope === 'all') {
            $installment->group->delete();

            return;
        }

        $targets = $this->resolveTargets($installment, $scope);
        $group   = $installment->group;

        \Illuminate\Support\Facades\DB::transaction(function () use ($targets, $group) {
            foreach ($targets as $target) {
                if ($target->transaction) {
                    // Dissocia do grupo para evitar o observer que deleta o grupo inteiro
                    $target->transaction->update(['installment_group_id' => null]);
                    $target->transaction->delete();
                }
                $target->delete();
            }

            if ($group->installments()->count() === 0) {
                $group->delete();
            } else {
                $group->update([
                    'total_installments' => $group->installments()->count(),
                    'total_amount'       => $group->installments()->sum('amount'),
                ]);
            }
        });
    }

    private function resolveTargets(Installment $installment, string $scope)
    {
        return match ($scope) {
            'only_this'       => collect([$installment]),
            'this_and_future' => $installment->group->installments()
                ->where('number', '>=', $installment->number)
                ->get(),
            'all'             => $installment->group->installments,
            default           => collect([$installment]),
        };
    }
}
