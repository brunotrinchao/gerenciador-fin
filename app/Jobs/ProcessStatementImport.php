<?php

namespace App\Jobs;

use App\Models\Category;
use App\Models\CreditCardStatement;
use App\Services\AI\GeminiService;
use App\Services\Import\DuplicateDetector;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessStatementImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 120;

    public function __construct(public readonly int $statementId) {}

    public function handle(DuplicateDetector $duplicateDetector, GeminiService $geminiService): void
    {
        $statement = CreditCardStatement::findOrFail($this->statementId);
        $userId    = $statement->user_id;
        $rawItems  = collect($statement->raw_items ?? []);

        if ($rawItems->isEmpty()) {
            $statement->update(['import_status' => 'failed']);
            Log::warning("ProcessStatementImport: statement #{$this->statementId} sem raw_items");
            return;
        }

        // Detecção de duplicatas
        $items = $duplicateDetector->detect($userId, $rawItems);

        // Categorização por IA (apenas itens novos)
        $newItems = $items->where('status_import', 'new');
        if ($newItems->isNotEmpty()) {
            $categories = Category::where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $userId))
                ->where('type', 'expense')
                ->pluck('name')
                ->toArray();

            $descriptions = $newItems->pluck('description')->toArray();
            $aiMapping    = $geminiService->categorizeBatch($descriptions, $categories);

            if (!empty($aiMapping)) {
                $categoryModels = Category::whereIn('name', array_values($aiMapping))->get()->keyBy('name');

                $items = $items->map(function (array $item) use ($aiMapping, $categoryModels) {
                    if ($item['status_import'] === 'new' && isset($aiMapping[$item['description']])) {
                        $catName = $aiMapping[$item['description']];
                        if (isset($categoryModels[$catName])) {
                            $item['category_id']   = $categoryModels[$catName]->id;
                            $item['category_name'] = $catName;
                        }
                    }
                    return $item;
                });
            }
        }

        $statement->update([
            'parsed_items' => $items->values()->toArray(),
            'import_status' => 'review_pending',
        ]);

        Log::info("ProcessStatementImport: statement #{$this->statementId} processado — {$items->count()} item(s)");
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("ProcessStatementImport falhou para statement #{$this->statementId}: " . $exception->getMessage());

        CreditCardStatement::find($this->statementId)?->update(['import_status' => 'failed']);
    }
}
