<?php

namespace App\Services\Import;

use App\DTO\ImportedInvoiceDTO;
use App\Services\Import\Invoice\InvoiceParserFactory;
use Smalot\PdfParser\Parser;

class PdfParser
{
    public function __construct(protected InvoiceParserFactory $factory) {}

    /**
     * Parseia o arquivo PDF e retorna um DTO estruturado.
     */
    public function parse(string $filePath, array $excludeDrivers = []): ImportedInvoiceDTO
    {
        $text   = $this->getText($filePath);
        $driver = $this->factory->make($text, $excludeDrivers);

        return $driver->parse($text);
    }

    public function getText(string $filePath): string
    {
        try {
            $parser = new Parser();
            $pdf    = $parser->parseFile($filePath);
            return $pdf->getText();
        } catch (\Exception $e) {
            throw new \Exception('Erro ao parsear PDF: ' . $e->getMessage());
        }
    }
}
