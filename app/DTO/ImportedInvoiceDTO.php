<?php

namespace App\DTO;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

readonly class ImportedInvoiceDTO
{
    /**
     * @param InvoiceDTO $invoice
     * @param BankDTO $bank
     * @param CardDTO $card
     * @param Collection<int, InvoiceTransactionDTO> $transactions
     */
    public function __construct(
       public InvoiceDTO $invoice,
       public BankDTO $bank,
       public CardDTO $card,
       public Collection $transactions,
       public float $totalAmount,
       public ?bool $isValidSum = null,
    )
    {
    }

    public static function fromArray(array $data): self
    {
        // Mapeia as transações para DTOs individuais
        $transactions = collect($data['transactions'] ?? [])->map(function ($item) {
            return new InvoiceTransactionDTO(
                date: Carbon::parse($item['date']),
                description: $item['description'],
                amount: (float) $item['amount'],
                isParcelado: (bool) $item['is_parcelado'],
                parcelaAtual: (int) $item['parcela_atual'],
                parcelaTotal: (int) $item['parcela_total'],
                firstInstallmentDate: $item['first_installment_date'],
                isIncome: (bool) $item['is_income']
            );
        });

        // Calcula a soma das transações para validar o totalAmount se necessário
        $calculatedSum = $transactions->sum(fn($t) => $t->isIncome ? -$t->amount : $t->amount);
        $totalFromAi = (float) ($data['invoice']['total_amount'] ?? 0);

        return new self(
            invoice: new InvoiceDTO(
                dueDateInvoice: $data['invoice']['due_date_invoice'],
                totalAmount: $totalFromAi
            ),
            bank: new BankDTO(
                name: $data['bank']['bank_name'],
                cnpj: $data['bank']['bank_cnpj']
            ),
            card: new CardDTO(
                name: $data['card']['name'],
                brand: $data['card']['brand'],
                lastFourDigits: $data['card']['last_four_digits'],
                closingDay: (int) $data['card']['closing_day'],
                dueDay: (int) $data['card']['due_day'],
                limit: $data['card']['limit'],
                used: $data['card']['used']
            ),
            transactions: $transactions,
            totalAmount: $totalFromAi,
            isValidSum: abs($calculatedSum - $totalFromAi) < 0.01 // Tolerância de centavos
        );
    }

}
