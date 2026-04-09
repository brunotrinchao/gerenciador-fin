<?php

namespace App\Services;

class SimulatorService
{
    public function compare(array $scenarioA, array $scenarioB, int $months = 24): array
    {
        return [
            'scenario_a' => $this->project($scenarioA, $months),
            'scenario_b' => $this->project($scenarioB, $months),
            'months'     => $months,
        ];
    }

    private function project(array $scenario, int $months): array
    {
        $balance    = (float) ($scenario['initial_amount'] ?? 0);
        $monthly    = (float) ($scenario['monthly_contribution'] ?? 0);
        $annualRate = (float) ($scenario['annual_rate'] ?? 0);
        $cost       = (float) ($scenario['monthly_cost'] ?? 0);
        $rate       = ($annualRate / 100) / 12; // taxa mensal
        $points     = [];

        for ($i = 1; $i <= $months; $i++) {
            $balance  = ($balance + $monthly - $cost) * (1 + $rate);
            $points[] = ['month' => $i, 'balance' => round($balance, 2)];
        }

        $initialAmount  = (float) ($scenario['initial_amount'] ?? 0);
        $totalInvested  = $initialAmount + ($monthly * $months);
        $totalReturn    = round($balance - $totalInvested, 2);

        return [
            'name'           => $scenario['name'] ?? 'Cenário',
            'description'    => $scenario['description'] ?? '',
            'final_value'    => round($balance, 2),
            'total_invested' => round($totalInvested, 2),
            'total_return'   => $totalReturn,
            'points'         => $points,
        ];
    }
}
