<?php

namespace App\Models;

use App\Enums\TransactionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CreditCard extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::deleting(function (CreditCard $card) {
            $card->statements()->each(function ($statement) {
                $statement->delete();
            });
            $card->installmentGroups()->each(function ($group) {
                $group->delete();
            });
            $card->transactions()->each(function ($transaction) {
                $transaction->delete();
            });
        });
    }

    protected $fillable = [
        'user_id', 'bank_account_id', 'name', 'brand', 'last_four_digits',
        'credit_limit', 'available_limit', 'limit_adjustment', 'closing_day', 'due_day',
        'color', 'is_active',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'available_limit' => 'decimal:2',
        'limit_adjustment' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function statements(): HasMany
    {
        return $this->hasMany(CreditCardStatement::class);
    }

    public function installmentGroups(): HasMany
    {
        return $this->hasMany(InstallmentGroup::class);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function recalculateLimit(): void
    {
        $totalSpent = Transaction::where('credit_card_id', $this->id)
            ->whereIn('status', [TransactionStatus::Pending, TransactionStatus::Paid])
            ->sum('amount');

        $this->updateOrCreate(['id' => $this->id], ['available_limit' => $this->credit_limit - $totalSpent + ($this->limit_adjustment ?? 0)]);
    }

    public function calculateDueDate(\DateTime $purchaseDate): \DateTime
    {
        $day = $purchaseDate->format('j');
        $dueDate = clone $purchaseDate;

        if ($day <= $this->closing_day) {
            $dueDate->modify('first day of next month');
        } else {
            $dueDate->modify('first day of +2 months');
        }

        $dueDate->setDate((int) $dueDate->format('Y'), (int) $dueDate->format('m'), $this->due_day);

        return $dueDate;
    }
}
