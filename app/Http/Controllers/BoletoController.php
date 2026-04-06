<?php

namespace App\Http\Controllers;

use App\Services\Import\PdfParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BoletoController extends Controller
{
    public function __construct(protected PdfParser $pdfParser) {}

    /**
     * Recebe um PDF de boleto, extrai os dados principais e retorna JSON
     * para que o frontend pré-preencha o modal de nova transação.
     */
    public function parse(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:5120',
        ]);

        try {
            $file = $request->file('file');
            $dto  = $this->pdfParser->parse($file->getRealPath());

            return response()->json([
                'description' => $dto->card->name ?? 'Boleto',
                'amount'      => $dto->totalAmount > 0 ? $dto->totalAmount : null,
                'date'        => $dto->invoice->dueDateInvoice
                                    ? $dto->invoice->dueDateInvoice->format('Y-m-d')
                                    : null,
                'notes'       => $dto->bank->cnpj
                                    ? "CNPJ: {$dto->bank->cnpj}"
                                    : null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('BoletoController: falha ao extrair dados do boleto — ' . $e->getMessage());

            return response()->json([
                'error' => 'Não foi possível extrair os dados do boleto. Preencha manualmente.',
            ], 422);
        }
    }
}
