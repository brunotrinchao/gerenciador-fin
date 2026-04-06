<?php

namespace App\Models;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted()
    {
        static::deleting(function (Transaction $transaction) {
            if ($transaction->installment_group_id) {
                $group = InstallmentGroup::find($transaction->installment_group_id);
                if ($group) {
                    $group->delete();
                }
            }
        });
    }

    protected $fillable = [
        'user_id', 'bank_account_id', 'credit_card_id', 'credit_card_statement_id',
        'category_id', 'installment_group_id', 'parent_transaction_id', 'description',
        'amount', 'type', 'status', 'date', 'competence_date', 'notes', 'is_recurring',
        'recurrence_rule', 'recurrence_end_date', 'recurrence_occurrences',
        'is_imported', 'import_hash',
        'payment_code', 'beneficiary_name', 'beneficiary_document',
    ];

    protected $casts = [
        'type' => TransactionType::class,
        'status' => TransactionStatus::class,
        'amount' => 'decimal:2',
        'date' => 'date',
        'competence_date' => 'date',
        'recurrence_end_date' => 'date',
        'is_recurring' => 'boolean',
        'is_imported' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function creditCard(): BelongsTo
    {
        return $this->belongsTo(CreditCard::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function installmentGroup(): BelongsTo
    {
        return $this->belongsTo(InstallmentGroup::class);
    }

    public function creditCardStatement(): BelongsTo
    {
        return $this->belongsTo(CreditCardStatement::class);
    }

    public function parentTransaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'parent_transaction_id');
    }

    public function childTransactions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Transaction::class, 'parent_transaction_id');
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopePending($query)
    {
        return $query->where('status', TransactionStatus::Pending);
    }

    public function scopePaid($query)
    {
        return $query->where('status', TransactionStatus::Paid);
    }

    public function scopeCurrentMonth($query)
    {
        return $query->whereMonth('date', now()->month)->whereYear('date', now()->year);
    }

    public function scopeExpenses($query)
    {
        return $query->whereIn('type', [TransactionType::Expense, TransactionType::CreditCard]);
    }

    public function scopeIncomes($query)
    {
        return $query->where('type', TransactionType::Income);
    }

    public function markAsPaid(): void
    {
        $this->update(['status' => TransactionStatus::Paid]);
    }

    public static function generateImportHash(string $date, int $amountCents, string $description): string
    {
        $normalized = strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', $description));
        $normalized = preg_replace('/\s+/', ' ', trim($normalized));

        return hash('sha256', "{$date}|{$amountCents}|{$normalized}");
    }
}
