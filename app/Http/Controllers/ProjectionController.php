<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Services\FinancialProjectionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProjectionController extends Controller
{
    public function index(Request $request, FinancialProjectionService $service): Response
    {
        $userId  = Auth::id();
        $months  = max(1, min(24, (int) $request->input('months', 12)));
        $projection = $service->generate($userId, $months);

        $currentBalance = (float) BankAccount::byUser($userId)->active()->sum('current_balance');

        $totalIncome  = array_sum(array_column($projection, 'income'));
        $totalExpense = array_sum(array_column($projection, 'expense'))
                      + array_sum(array_column($projection, 'installments'))
                      + array_sum(array_column($projection, 'credit_card'));

        $finalBalance = !empty($projection) ? end($projection)['balance'] : $currentBalance;

        return Inertia::render('Projection', [
            'projection'            => $projection,
            'currentBalance'        => round($currentBalance, 2),
            'totalProjectedIncome'  => round($totalIncome, 2),
            'totalProjectedExpense' => round($totalExpense, 2),
            'finalBalance'          => round($finalBalance, 2),
            'months'                => $months,
        ]);
    }
}
