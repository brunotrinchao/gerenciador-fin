<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvestmentSnapshot extends Model
{
    protected $fillable = [
        'investment_id', 'reference_date', 'amount', 'yield_amount', 'yield_percentage',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'yield_amount' => 'decimal:2',
        'yield_percentage' => 'decimal:4',
        'reference_date' => 'date',
    ];

    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class);
    }
}
