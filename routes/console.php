<?php

use App\Console\Commands\ProcessScheduledTransactionsCommand;
use App\Jobs\ProcessNotificationsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(ProcessScheduledTransactionsCommand::class)
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/scheduled-transactions.log'));

Schedule::job(new ProcessNotificationsJob())->dailyAt('08:00')->withoutOverlapping();
