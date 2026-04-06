<?php

namespace App\Models;

use App\Enums\TransactionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Installment extends Model
{
    use HasFactory;

    protected $fillable = [
        'installment_group_id', 'transaction_id', 'number',
        'amount', 'due_date', 'status', 'paid_at',
    ];

    protected $casts = [
        'status' => TransactionStatus::class,
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    protected $appends = ['is_overdue'];

    public function group(): BelongsTo
    {
        return $this->belongsTo(InstallmentGroup::class, 'installment_group_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->status === TransactionStatus::Pending
            && $this->due_date->isPast();
    }

    public function markAsPaid(): void
    {
        $this->update([
            'status' => TransactionStatus::Paid,
            'paid_at' => now(),
        ]);

        $this->group->increment('paid_installments');

        if ($this->transaction) {
            $this->transaction->markAsPaid();
        }
    }
}
