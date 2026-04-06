<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CreditCardStatement extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::deleting(function (CreditCardStatement $statement) {
            $statement->transactions()->each(function ($transaction) {
                $transaction->delete();
            });
        });
    }

    protected $fillable = [
        'user_id', 'credit_card_id', 'reference_month', 'closing_date',
        'due_date', 'total_amount', 'paid_amount', 'status',
        'file_path', 'file_name', 'import_status', 'imported_at',
        'raw_items', 'parsed_items',
    ];

    protected $casts = [
        'total_amount'  => 'decimal:2',
        'paid_amount'   => 'decimal:2',
        'closing_date'  => 'date',
        'due_date'      => 'date',
        'imported_at'   => 'datetime',
        'raw_items'     => 'array',
        'parsed_items'  => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creditCard(): BelongsTo
    {
        return $this->belongsTo(CreditCard::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'credit_card_statement_id');
    }
}
