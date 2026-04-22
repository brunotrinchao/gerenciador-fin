<?php

namespace App\Http\Controllers;

use App\Services\AI\CloudflareAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AIAnalysisController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('AIAnalysis/Index', [
            'month'     => $request->integer('month', now()->month),
            'year'      => $request->integer('year', now()->year),
            'hasAi'     => !empty(env('CLOUDFLARE_API_KEY')),
        ]);
    }

    public function generate(Request $request, CloudflareAiService $ai): JsonResponse
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year'  => 'required|integer|min:2020|max:2030',
        ]);

        try {
            $analysis = $ai->generateMonthlyAnalysis(
                auth()->user(),
                $request->integer('month'),
                $request->integer('year')
            );
            return response()->json(['analysis' => $analysis]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Falha ao gerar análise com Cloudflare AI. Tente novamente.'], 500);
        }
    }
}
