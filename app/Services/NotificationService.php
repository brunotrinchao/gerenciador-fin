<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\Budget;
use App\Models\CreditCard;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Carbon;

class NotificationService
{
    public function processAll(User $user): void
    {
        $this->checkLowBalance($user);
        $this->checkUpcomingDues($user);
        $this->checkCardNearLimit($user);
        $this->checkBudgetExceeded($user);
    }

    public function checkLowBalance(User $user): void
    {
        $preference = NotificationPreference::where('user_id', $user->id)
            ->where('alert_type', 'low_balance')
            ->first();

        if (!$preference || !$preference->enabled || $preference->threshold === null) {
            return;
        }

        $accounts = BankAccount::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        foreach ($accounts as $account) {
            if ($account->current_balance < $preference->threshold) {
                if ($this->alreadyNotifiedToday($user->id, 'low_balance')) {
                    continue;
                }

                Notification::create([
                    'user_id' => $user->id,
                    'type'    => 'low_balance',
                    'title'   => 'Saldo baixo',
                    'message' => "A conta \"{$account->name}\" está com saldo de R$ " . number_format($account->current_balance, 2, ',', '.') . ', abaixo do limite configurado.',
                    'data'    => ['bank_account_id' => $account->id, 'balance' => $account->current_balance],
                ]);
            }
        }
    }

    public function checkUpcomingDues(User $user): void
    {
        $transactions = Transaction::where('user_id', $user->id)
            ->where('status', 'pending')
            ->whereBetween('date', [Carbon::today(), Carbon::today()->addDays(3)])
            ->get();

        foreach ($transactions as $transaction) {
            if ($this->alreadyNotifiedToday($user->id, 'upcoming_due')) {
                break;
            }

            Notification::create([
                'user_id' => $user->id,
                'type'    => 'upcoming_due',
                'title'   => 'Vencimento próximo',
                'message' => "A transação \"{$transaction->description}\" de R$ " . number_format($transaction->amount, 2, ',', '.') . ' vence em ' . Carbon::parse($transaction->date)->format('d/m/Y') . '.',
                'data'    => ['transaction_id' => $transaction->id],
            ]);
        }
    }

    public function checkCardNearLimit(User $user): void
    {
        $cards = CreditCard::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        foreach ($cards as $card) {
            if ($card->credit_limit <= 0) {
                continue;
            }

            $usagePercent = (($card->credit_limit - $card->available_limit) / $card->credit_limit) * 100;

            if ($usagePercent > 80) {
                if ($this->alreadyNotifiedToday($user->id, 'card_near_limit')) {
                    continue;
                }

                Notification::create([
                    'user_id' => $user->id,
                    'type'    => 'card_near_limit',
                    'title'   => 'Cartão próximo do limite',
                    'message' => "O cartão \"{$card->name}\" está com " . number_format($usagePercent, 0) . '% do limite utilizado.',
                    'data'    => ['credit_card_id' => $card->id, 'usage_percent' => $usagePercent],
                ]);
            }
        }
    }

    public function checkBudgetExceeded(User $user): void
    {
        $budgets = Budget::where('user_id', $user->id)
            ->where(function ($q) {
                $q->whereNull('reference_month')
                    ->orWhere('reference_month', Carbon::now()->format('Y-m'));
            })
            ->with('category')
            ->get();

        foreach ($budgets as $budget) {
            $spent = Transaction::where('user_id', $user->id)
                ->where('category_id', $budget->category_id)
                ->where('type', 'expense')
                ->whereYear('date', Carbon::now()->year)
                ->whereMonth('date', Carbon::now()->month)
                ->whereNotIn('status', ['cancelled'])
                ->sum('amount');

            if ($spent > $budget->amount) {
                if ($this->alreadyNotifiedToday($user->id, 'budget_exceeded')) {
                    continue;
                }

                $categoryName = $budget->category?->name ?? 'Categoria';

                Notification::create([
                    'user_id' => $user->id,
                    'type'    => 'budget_exceeded',
                    'title'   => 'Orçamento excedido',
                    'message' => "O orçamento de \"{$categoryName}\" foi excedido. Gasto: R$ " . number_format($spent, 2, ',', '.') . ' / Limite: R$ ' . number_format($budget->amount, 2, ',', '.') . '.',
                    'data'    => ['budget_id' => $budget->id, 'spent' => $spent, 'limit' => $budget->amount],
                ]);
            }
        }
    }

    private function alreadyNotifiedToday(int $userId, string $type): bool
    {
        return Notification::where('user_id', $userId)
            ->where('type', $type)
            ->whereDate('created_at', Carbon::today())
            ->whereNull('read_at')
            ->exists();
    }
}
