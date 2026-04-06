<?php

namespace App\Models;

use App\Enums\InvestmentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Investment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'bank_account_id', 'name', 'type', 'institution',
        'invested_amount', 'current_amount', 'yield_rate', 'yield_type',
        'start_date', 'maturity_date', 'status',
    ];

    protected $casts = [
        'type' => InvestmentType::class,
        'invested_amount' => 'decimal:2',
        'current_amount' => 'decimal:2',
        'yield_rate' => 'decimal:4',
        'start_date' => 'date',
        'maturity_date' => 'date',
    ];

    protected $appends = ['total_yield', 'yield_percentage', 'days_to_maturity'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function snapshots(): HasMany
    {
        return $this->hasMany(InvestmentSnapshot::class);
    }

    public function getTotalYieldAttribute(): float
    {
        return (float) $this->current_amount - (float) $this->invested_amount;
    }

    public function getYieldPercentageAttribute(): float
    {
        if ($this->invested_amount == 0) {
            return 0;
        }

        return round(($this->current_amount / $this->invested_amount - 1) * 100, 2);
    }

    public function getDaysToMaturityAttribute(): ?int
    {
        if (!$this->maturity_date) {
            return null;
        }

        return (int) now()->diffInDays($this->maturity_date, false);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function takeSnapshot(): InvestmentSnapshot
    {
        return $this->snapshots()->create([
            'reference_date' => now()->toDateString(),
            'amount' => $this->current_amount,
            'yield_amount' => $this->total_yield,
            'yield_percentage' => $this->yield_percentage,
        ]);
    }
}
