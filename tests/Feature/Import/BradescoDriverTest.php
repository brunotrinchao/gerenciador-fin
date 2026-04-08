<?php

namespace Tests\Feature\Import;

use App\Services\Import\Invoice\BradescoDriver;
use App\Services\Import\PdfParser;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Testes unitários do BradescoDriver usando o PDF real de storage/invoices/fatura-bradesco.pdf.
 *
 * Os testes usam BradescoDriver diretamente (não via factory) para garantir que
 * o driver correto é testado independente da ordem de prioridade da factory.
 */
class BradescoDriverTest extends TestCase
{
    private string $pdfPath;
    private string $text;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pdfPath = storage_path('invoices/fatura-bradesco.pdf');

        if (file_exists($this->pdfPath)) {
            $this->text = app(PdfParser::class)->getText($this->pdfPath);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Infraestrutura
    // ─────────────────────────────────────────────────────────────────────────

    public function test_bradesco_pdf_exists(): void
    {
        $this->assertFileExists(
            $this->pdfPath,
            'PDF de teste não encontrado em storage/invoices/fatura-bradesco.pdf'
        );
    }

    public function test_bradesco_driver_detects_pdf(): void
    {
        $this->assertFileExists($this->pdfPath);

        $driver = new BradescoDriver();
        $this->assertTrue(
            $driver->canParse($this->text),
            'BradescoDriver não reconheceu o PDF'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Data de vencimento — o bug reportado
    // ─────────────────────────────────────────────────────────────────────────

    public function test_bradesco_due_date_is_march_25_2026(): void
    {
        $this->assertFileExists($this->pdfPath);

        $result  = (new BradescoDriver())->parse($this->text);
        $dueDate = Carbon::parse($result->invoice->dueDateInvoice)->format('Y-m-d');

        $this->assertEquals(
            '2026-03-25',
            $dueDate,
            "Data de vencimento incorreta. Esperado: 2026-03-25 | Recebido: {$dueDate}"
        );
    }

    public function test_bradesco_due_date_month_is_march_not_february(): void
    {
        $this->assertFileExists($this->pdfPath);

        $result = (new BradescoDriver())->parse($this->text);
        $month  = Carbon::parse($result->invoice->dueDateInvoice)->month;

        $this->assertEquals(
            3,
            $month,
            "Mês do vencimento deveria ser março (3), mas foi {$month}. PDF diz 25/03/2026."
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Dados gerais do driver
    // ─────────────────────────────────────────────────────────────────────────

    public function test_bradesco_parses_bank_name(): void
    {
        $this->assertFileExists($this->pdfPath);

        $result = (new BradescoDriver())->parse($this->text);
        $this->assertEquals('Bradesco', $result->bank->name);
    }

    public function test_bradesco_parses_transactions(): void
    {
        $this->assertFileExists($this->pdfPath);

        $result = (new BradescoDriver())->parse($this->text);
        $this->assertNotEmpty(
            $result->transactions,
            'Nenhuma transação foi parseada da fatura Bradesco'
        );
    }

    public function test_bradesco_transactions_have_positive_amounts(): void
    {
        $this->assertFileExists($this->pdfPath);

        $result = (new BradescoDriver())->parse($this->text);
        foreach ($result->transactions as $tx) {
            $this->assertGreaterThan(
                0,
                $tx->amount,
                "Transação '{$tx->description}' tem valor <= 0: {$tx->amount}"
            );
        }
    }
}
