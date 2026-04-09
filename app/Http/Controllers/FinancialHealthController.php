<?php

namespace App\Http\Controllers;

use App\Services\FinancialHealthScoreService;
use Inertia\Inertia;
use Inertia\Response;

class FinancialHealthController extends Controller
{
    public function index(FinancialHealthScoreService $service): Response
    {
        $score = $service->calculate(auth()->id());

        return Inertia::render('HealthScore/Index', ['score' => $score]);
    }
}
