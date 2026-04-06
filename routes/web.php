<?php

use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\CreditCardController;
use App\Http\Controllers\BankAccountController;
use App\Http\Controllers\InstallmentGroupController;
use App\Http\Controllers\InstallmentController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Settings\ClearDataController;
use App\Http\Controllers\Settings\RoleController;
use App\Http\Controllers\Settings\MemberController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\InvestmentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ProjectionController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\BoletoController;
use App\Http\Controllers\ReportController;
use App\Http\Middleware\EnsureIsAdmin;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Rotas públicas ───────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login', fn () => Inertia::render('Auth/Login'))->name('login');
});

Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');
Route::post('/logout', [GoogleController::class, 'logout'])->name('logout');

// ─── Rotas protegidas ─────────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    
    // Módulos CRUD
    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');
    Route::patch('/transactions/{transaction}', [TransactionController::class, 'update'])->name('transactions.update');
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])->name('transactions.destroy');
    Route::patch('/transactions/{transaction}/pay', [TransactionController::class, 'markAsPaid'])->name('transactions.pay');
    Route::get('/credit-cards', [CreditCardController::class, 'index'])->name('credit-cards.index');
    Route::post('/credit-cards', [CreditCardController::class, 'store'])->name('credit-cards.store');
    Route::patch('/credit-cards/{creditCard}', [CreditCardController::class, 'update'])->name('credit-cards.update');
    Route::delete('/credit-cards/{creditCard}', [CreditCardController::class, 'destroy'])->name('credit-cards.destroy');

    // Installments
    Route::get('/installments', [InstallmentGroupController::class, 'index'])->name('installments.index');
    Route::post('/installments', [InstallmentGroupController::class, 'store'])->name('installments.store');
    Route::delete('/installments/{installmentGroup}', [InstallmentGroupController::class, 'destroy'])->name('installments.destroy');
    Route::patch('/installments/{installment}/pay', [InstallmentController::class, 'markAsPaid'])->name('installments.pay');
    Route::get('/bank-accounts', [BankAccountController::class, 'index'])->name('bank-accounts.index');
    Route::post('/bank-accounts', [BankAccountController::class, 'store'])->name('bank-accounts.store');
    Route::patch('/bank-accounts/{bankAccount}', [BankAccountController::class, 'update'])->name('bank-accounts.update');
    Route::delete('/bank-accounts/{bankAccount}', [BankAccountController::class, 'destroy'])->name('bank-accounts.destroy');

    // Investments
    Route::get('/investments', [InvestmentController::class, 'index'])->name('investments.index');
    Route::post('/investments', [InvestmentController::class, 'store'])->name('investments.store');
    Route::patch('/investments/{investment}', [InvestmentController::class, 'update'])->name('investments.update');
    Route::delete('/investments/{investment}', [InvestmentController::class, 'destroy'])->name('investments.destroy');
    Route::post('/investments/{investment}/snapshot', [InvestmentController::class, 'snapshot'])->name('investments.snapshot');
    Route::post('/investments/{investment}/redeem', [InvestmentController::class, 'redeem'])->name('investments.redeem');

    // Categorias
    Route::resource('categories', CategoryController::class)->except(['create', 'show', 'edit']);

    // Configurações e RBAC (Apenas Admin)
    Route::middleware([EnsureIsAdmin::class])->prefix('settings')->group(function () {
        Route::get('/', fn () => \Inertia\Inertia::render('Settings/Index'))->name('settings.index');

        Route::get('/roles', [RoleController::class, 'index'])->name('settings.roles.index');
        Route::post('/roles', [RoleController::class, 'store'])->name('settings.roles.store');
        Route::patch('/roles/{role}', [RoleController::class, 'update'])->name('settings.roles.update');
        Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('settings.roles.destroy');

        Route::get('/members', [MemberController::class, 'index'])->name('settings.members.index');
        Route::post('/members/invite', [MemberController::class, 'storeInvite'])->name('settings.members.invite');

        Route::delete('/clear-data', [ClearDataController::class, 'destroy'])->name('settings.clear-data');
    });

    // Projeção financeira
    Route::get('/projection', [ProjectionController::class, 'index'])->name('projection.index');

    // Calendário de pagamentos
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');

    // Importar Boleto PDF (deve vir antes do resource de transactions para evitar conflito)
    Route::post('/transactions/boleto-parse', [BoletoController::class, 'parse'])->name('transactions.boleto-parse');

    // Importação
    Route::get('/imports', [ImportController::class, 'index'])->name('imports.index');
    Route::post('/imports/upload', [ImportController::class, 'upload'])->name('imports.upload');
    Route::post('/imports/process', [ImportController::class, 'process'])->name('imports.process');
    Route::post('/imports/store', [ImportController::class, 'store'])->name('imports.store');
    Route::post('/imports/process-boleto', [ImportController::class, 'processBoleto'])->name('imports.process-boleto');
    Route::get('/imports/{statement}/review', [ImportController::class, 'review'])->name('imports.review');
    Route::get('/imports/{statement}/status', [ImportController::class, 'statusJson'])->name('imports.status');

    // Relatórios
    Route::get('/relatorios', [ReportController::class, 'index'])->name('reports.index');

    // Invoices (Faturas)
    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::patch('/invoices/{statement}', [InvoiceController::class, 'update'])->name('invoices.update');
    Route::patch('/invoices/{statement}/pay', [InvoiceController::class, 'pay'])->name('invoices.pay');
    Route::delete('/invoices/{statement}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');
});
