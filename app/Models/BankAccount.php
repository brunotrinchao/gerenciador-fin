<?php

namespace App\Models;

use App\Enums\AccountType;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'name', 'bank_name', 'bank_code',
        'account_type', 'initial_balance', 'current_balance',
        'overdraft_limit', 'color', 'is_active',
    ];

    protected $casts = [
        'account_type' => AccountType::class,
        'initial_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'overdraft_limit' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function creditCards(): HasMany
    {
        return $this->hasMany(CreditCard::class);
    }

    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function recalculateBalance(): void
    {
        $income = $this->transactions()
            ->whereIn('type', [TransactionType::Income->value, TransactionType::InvestmentOut->value])
            ->where('status', TransactionStatus::Paid->value)
            ->sum('amount');

        $expense = $this->transactions()
            ->whereIn('type', [TransactionType::Expense->value, TransactionType::InvestmentIn->value])
            ->where('status', TransactionStatus::Paid->value)
            ->sum('amount');

        $this->update([
            'current_balance' => $this->initial_balance + $income - $expense,
        ]);
    }
}
