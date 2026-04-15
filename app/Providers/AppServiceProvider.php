<?php

namespace App\Providers;

use App\Models\Transaction;
use App\Observers\TransactionObserver;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (str_contains(config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        \App\Models\Transaction::observe(\App\Observers\TransactionObserver::class);
        \App\Models\Installment::observe(\App\Observers\InstallmentObserver::class);
        \App\Models\CreditCardStatement::observe(\App\Observers\CreditCardStatementObserver::class);
    }
}
