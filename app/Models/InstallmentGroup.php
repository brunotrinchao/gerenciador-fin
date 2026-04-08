<?php

namespace App\Models;

use App\Enums\InstallmentStatus;
use App\Enums\TransactionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class InstallmentGroup extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted()
    {
        static::deleting(function (InstallmentGroup $group) {
            DB::transaction(function () use ($group) {
                $group->installments()->each(function ($installment) {
                    $installment->delete();
                });

                Transaction::where('installment_group_id', $group->id)
                    ->get()
                    ->each(function ($transaction) {
                        $transaction->installment_group_id = null;
                        $transaction->save();
                        $transaction->delete();
                    });
            });
        });
    }

    protected $fillable = [
        'user_id', 'credit_card_id', 'bank_account_id', 'category_id',
        'description', 'total_amount', 'installment_amount', 'total_installments',
        'paid_installments', 'start_date', 'status',
    ];

    protected $casts = [
        'status' => InstallmentStatus::class,
        'total_amount' => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'start_date' => 'date',
    ];

    protected $appends = ['progress', 'total_remaining'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creditCard(): BelongsTo
    {
        return $this->belongsTo(CreditCard::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function installments(): HasMany
    {
        return $this->hasMany(Installment::class);
    }

    public function getProgressAttribute(): float
    {
        if ($this->total_installments === 0) {
            return 0;
        }

        return round(($this->paid_installments / $this->total_installments) * 100, 1);
    }

    public function getTotalRemainingAttribute(): float
    {
        // Usa total_amount como fonte da verdade para evitar erro de arredondamento
        // da última parcela (que pode ser diferente das demais).
        $paid       = (int) $this->paid_installments;
        $paidAmount = round($paid * (float) $this->installment_amount, 2);

        return max(0.0, round((float) $this->total_amount - $paidAmount, 2));
    }

    public function cancelFutureInstallments(): void
    {
        $this->installments()
            ->where('status', TransactionStatus::Pending->value)
            ->update(['status' => TransactionStatus::Cancelled->value]);

        $this->update(['status' => InstallmentStatus::Cancelled]);
    }
}
