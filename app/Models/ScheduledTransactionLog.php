<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduledTransactionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'processed_at',
        'transactions_count',
        'failed_count',
        'processed_transaction_ids',
        'failed_transaction_ids',
        'execution_ms',
    ];

    protected $casts = [
        'processed_at'               => 'datetime',
        'processed_transaction_ids'  => 'array',
        'failed_transaction_ids'     => 'array',
    ];
}
