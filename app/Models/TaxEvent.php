<?php

namespace App\Models;

use App\Enums\TaxEventType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxEvent extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'bank_account_id', 'type', 'description',
        'year', 'total_amount', 'installments_count', 'first_due_date',
        'status', 'notes',
    ];

    protected $casts = [
        'total_amount'       => 'decimal:2',
        'first_due_date'     => 'date',
        'year'               => 'integer',
        'installments_count' => 'integer',
        'type'               => TaxEventType::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForYear($query, int $year)
    {
        return $query->where('year', $year);
    }
}
