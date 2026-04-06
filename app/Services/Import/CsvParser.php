<?php

namespace App\Services\Import;

use Illuminate\Support\Collection;
use League\Csv\Reader;

class CsvParser
{
    public function parse(string $filePath): Collection
    {
        $content = file_get_contents($filePath);

        // Detectar encoding e converter para UTF-8
        $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        if ($encoding && $encoding !== 'UTF-8') {
            $content = mb_convert_encoding($content, 'UTF-8', $encoding);
        } elseif (!$encoding) {
            // mb_detect_encoding retornou false — tenta UTF-8 e cai em Windows-1252
            $converted = @mb_convert_encoding($content, 'UTF-8', 'UTF-8');
            if ($converted === false || !mb_check_encoding($converted, 'UTF-8')) {
                $content = mb_convert_encoding($content, 'UTF-8', 'Windows-1252');
            }
        }

        $firstLine = explode("\n", $content)[0] ?? '';
        $separator = $this->detectSeparator($firstLine);

        $csv = Reader::createFromString($content);
        $csv->setDelimiter($separator);
        $csv->setHeaderOffset(0);

        $items = collect();

        foreach ($csv->getRecords() as $record) {
            $item = $this->parseRecord($record);
            if ($item) {
                $items->push($item);
            }
        }

        return $items;
    }

    protected function parseRecord(array $record): ?array
    {
        // Normalizar chaves para lowercase sem espaços
        $normalized = [];
        foreach ($record as $key => $value) {
            $normalized[strtolower(trim($key))] = trim($value ?? '');
        }

        // Detectar campos comuns de extratos brasileiros
        $date        = $this->findField($normalized, ['data', 'date', 'dt', 'data lançamento', 'data lancamento']);
        $description = $this->findField($normalized, ['descrição', 'descricao', 'description', 'histórico', 'historico', 'estabelecimento', 'lançamento', 'title']);

        if (!$date || !$description) {
            return null;
        }

        // Suporte a colunas separadas Débito/Crédito (XP/Rico: Data,Histórico,Débito,Crédito)
        // Para faturas de cartão, usar coluna Débito como valor positivo e ignorar Crédito
        $debitoRaw  = $this->findField($normalized, ['débito', 'debito']);
        $creditoRaw = $this->findField($normalized, ['crédito', 'credito']);
        $valorRaw   = $this->findField($normalized, ['valor', 'value', 'amount', 'vlr']);

        if ($debitoRaw !== null && $debitoRaw !== '') {
            $amount = $this->normalizeAmount($debitoRaw);
        } elseif ($valorRaw !== null && $valorRaw !== '') {
            $amount = $this->normalizeAmount($valorRaw);
        } elseif ($creditoRaw !== null && $creditoRaw !== '') {
            // Crédito em fatura de cartão (estorno) — ignorar para importação de débitos
            return null;
        } else {
            return null;
        }

        $parsedDate = $this->normalizeDate($date);

        if (!$parsedDate || $amount <= 0) {
            return null;
        }

        return [
            'date'          => $parsedDate,
            'description'   => $description,
            'amount'        => $amount,
            'status_import' => 'new',
            'category_id'   => null,
            'category_name' => null,
        ];
    }

    protected function detectSeparator(string $firstLine): string
    {
        // Contar fora de aspas
        $inQuote = false;
        $counts  = [';' => 0, ',' => 0, "\t" => 0];
        $len     = \strlen($firstLine);
        for ($i = 0; $i < $len; $i++) {
            $ch = $firstLine[$i];
            if ($ch === '"') { $inQuote = !$inQuote; continue; }
            if ($inQuote) continue;
            if (isset($counts[$ch])) $counts[$ch]++;
        }
        arsort($counts);
        return array_key_first($counts);
    }

    protected function findField(array $record, array $keys): ?string
    {
        foreach ($keys as $key) {
            if (isset($record[$key]) && $record[$key] !== '') {
                return $record[$key];
            }
        }
        return null;
    }

    protected function normalizeDate(string $date): ?string
    {
        $date = trim($date);

        // DD/MM/YYYY
        if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $date, $m)) {
            return "{$m[3]}-{$m[2]}-{$m[1]}";
        }

        // YYYY-MM-DD (já no formato correto)
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $date;
        }

        // DD-MM-YYYY
        if (preg_match('/^(\d{2})-(\d{2})-(\d{4})$/', $date, $m)) {
            return "{$m[3]}-{$m[2]}-{$m[1]}";
        }

        return null;
    }

    protected function normalizeAmount(string $amount): float
    {
        // Remove caracteres indesejados (R$, espaços)
        $amount = preg_replace('/[R$\s]/', '', $amount);
        // Remove pontos de milhar e converte vírgula
        $amount = str_replace('.', '', $amount);
        $amount = str_replace(',', '.', $amount);
        // Se negativo (débito), converte para positivo
        return abs((float) $amount);
    }
}
