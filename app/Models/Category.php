<?php

namespace App\Models;

use App\Enums\CategoryType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'name', 'icon', 'color', 'type', 'parent_id', 'is_default',
    ];

    protected $casts = [
        'type' => CategoryType::class,
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function budget(): HasOne
    {
        return $this->hasOne(Budget::class);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeIncomes($query)
    {
        return $query->where('type', 'income');
    }

    public function scopeExpenses($query)
    {
        return $query->where('type', 'expense');
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }
}
