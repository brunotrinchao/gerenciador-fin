<?php

namespace App\Http\Controllers;

use App\Services\SimulatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SimulatorController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Simulator/Index', [
            'presets' => $this->getPresets(),
        ]);
    }

    public function calculate(Request $request, SimulatorService $service): JsonResponse
    {
        $validated = $request->validate([
            'scenario_a'                      => 'required|array',
            'scenario_a.name'                 => 'required|string|max:100',
            'scenario_a.initial_amount'       => 'required|numeric|min:0',
            'scenario_a.monthly_contribution' => 'required|numeric|min:0',
            'scenario_a.annual_rate'          => 'required|numeric|min:0|max:100',
            'scenario_a.monthly_cost'         => 'nullable|numeric|min:0',
            'scenario_b'                      => 'required|array',
            'scenario_b.name'                 => 'required|string|max:100',
            'scenario_b.initial_amount'       => 'required|numeric|min:0',
            'scenario_b.monthly_contribution' => 'required|numeric|min:0',
            'scenario_b.annual_rate'          => 'required|numeric|min:0|max:100',
            'scenario_b.monthly_cost'         => 'nullable|numeric|min:0',
            'months'                          => 'required|integer|min:6|max:120',
        ]);

        $result = $service->compare(
            $validated['scenario_a'],
            $validated['scenario_b'],
            $validated['months']
        );

        return response()->json($result);
    }

    private function getPresets(): array
    {
        return [
            [
                'id'    => 'debt_vs_invest',
                'label' => 'Pagar Dívida vs Investir',
                'scenario_a' => [
                    'name'                 => 'Pagar Dívida',
                    'description'          => 'Quitar a dívida primeiro',
                    'initial_amount'       => 0,
                    'monthly_contribution' => 1000,
                    'annual_rate'          => 0,
                    'monthly_cost'         => 0,
                ],
                'scenario_b' => [
                    'name'                 => 'Investir Agora',
                    'description'          => 'Investir enquanto paga mínimo',
                    'initial_amount'       => 0,
                    'monthly_contribution' => 600,
                    'annual_rate'          => 12,
                    'monthly_cost'         => 0,
                ],
            ],
            [
                'id'    => 'conservative_vs_aggressive',
                'label' => 'Renda Fixa vs Renda Variável',
                'scenario_a' => [
                    'name'                 => 'Renda Fixa',
                    'description'          => 'Tesouro Direto ~11% a.a.',
                    'initial_amount'       => 10000,
                    'monthly_contribution' => 500,
                    'annual_rate'          => 11,
                    'monthly_cost'         => 0,
                ],
                'scenario_b' => [
                    'name'                 => 'Renda Variável',
                    'description'          => 'Ações ~15% a.a.',
                    'initial_amount'       => 10000,
                    'monthly_contribution' => 500,
                    'annual_rate'          => 15,
                    'monthly_cost'         => 0,
                ],
            ],
        ];
    }
}
