# Design: Transações Agendadas (Scheduled Transactions)

**Data:** 2026-04-09  
**Autor:** Bruno Souza  
**Status:** Aprovado — em implementação

---

## Visão Geral

Adicionar suporte a transações com status `scheduled` no sistema financeiro. Um job diário (Laravel Scheduler) processa automaticamente todas as transações agendadas com `date <= hoje`, marcando-as como `paid`, recalculando saldo e sincronizando com Google Calendar. Um log de histórico registra cada execução para rastreabilidade.

---

## Decisões de Design

| Pergunta | Decisão |
|---|---|
| Quantos status novos? | Um único: `scheduled` |
| Job marca como `paid` ou `pending`? | Direto para `paid` |
| Aplica a Installments? | Não — apenas `Transaction` |
| Catch-up retroativo? | Sim — processa `date <= hoje` |
| Notificação ao usuário? | Log de histórico (sem push/email) |
| Abordagem arquitetural? | Artisan Command + Laravel Scheduler |

---

## Arquitetura

```
Usuário cria Transaction com status "scheduled"
        ↓
TransactionObserver::created() → CreateCalendarEvent (future event)
        ↓
[Laravel Scheduler — diariamente às 06:00]
        ↓
ProcessScheduledTransactionsCommand (php artisan transactions:process-scheduled)
        ↓
ProcessScheduledTransactionsService::process()
        ↓
Para cada Transaction WHERE status=scheduled AND date <= today:
   → transaction->markAsPaid()
   → TransactionObserver::updated() → recalcula saldo + DeleteCalendarEvent
        ↓
Cria ScheduledTransactionLog (1 por execução)
        ↓
Página /scheduled-logs exibe histórico
```

---

## Camada de Dados

### TransactionStatus Enum — novo valor
```php
case Scheduled = 'scheduled'; // label: "Agendado"
```

### Tabela `scheduled_transaction_logs`
| Campo | Tipo | Descrição |
|---|---|---|
| id | bigint PK | |
| processed_at | timestamp | Início da execução |
| transactions_count | int unsigned | Qtd processadas com sucesso |
| failed_count | int unsigned | Qtd com falha |
| processed_transaction_ids | json | Array de IDs processados |
| failed_transaction_ids | json | Array de IDs com falha |
| execution_ms | int unsigned | Tempo de execução em ms |
| created_at / updated_at | timestamps | |

### Transaction Model — novo scope
```php
public function scopeScheduled(Builder $query): Builder
{
    return $query->where('status', TransactionStatus::Scheduled);
}
```

---

## Service Layer

### `ProcessScheduledTransactionsService`
- Busca `Transaction::scheduled()->where('date', '<=', today())->with(['bankAccount', 'user'])->get()`
- Try/catch individual por transação — falha não aborta as demais
- Chama `$transaction->markAsPaid()` → Observer cuida de saldo + Calendar
- Cria `ScheduledTransactionLog` ao final (mesmo se 0 processadas)
- Retorna o log criado

### `ProcessScheduledTransactionsCommand`
- Signature: `transactions:process-scheduled`
- Flag `--dry-run`: conta sem processar
- Output: processadas ✓ / falhas ✗ / tempo

### Scheduler (`routes/console.php`)
```php
Schedule::command(ProcessScheduledTransactionsCommand::class)
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/scheduled-transactions.log'));
```

---

## Observer Updates

### `created()` — adicionar `Scheduled` à condição de criar evento no Calendar
```php
$isEligibleForCalendar = in_array($transaction->status, [
    TransactionStatus::Pending,
    TransactionStatus::Scheduled,
]);
```

### `updated()` — deletar evento ao sair de `Scheduled` (além de `Pending`)
```php
$hadCalendarStatus = in_array(
    $transaction->getOriginal('status'),
    [TransactionStatus::Pending->value, TransactionStatus::Scheduled->value]
);
if ($transaction->wasChanged('status') && $hadCalendarStatus && $transaction->google_event_id) {
    // dispatch DeleteCalendarEvent
}
```

---

## Controller e Rotas

- `GET /scheduled-logs` → `ScheduledTransactionLogController@index`
- Retorna logs paginados (20/página) + transações associadas carregadas via `whereIn`

---

## Frontend

| Componente | Mudança |
|---|---|
| `resources/js/types/models.d.ts` | + interface `ScheduledTransactionLog` |
| `TransactionStatusBadge.tsx` | + badge amber com ícone Clock |
| Transaction form | + opção `scheduled` + auto-suggest em datas futuras |
| `Pages/ScheduledLogs/Index.tsx` | Nova página com cards por execução |
| `AppLayout.tsx` | + link "Processamentos Automáticos" no sidebar |

---

## Arquivos Modificados/Criados

| Arquivo | Tipo |
|---|---|
| `app/Enums/TransactionStatus.php` | Modificado |
| `app/Models/Transaction.php` | Modificado |
| `app/Models/ScheduledTransactionLog.php` | Novo |
| `app/Services/ProcessScheduledTransactionsService.php` | Novo |
| `app/Console/Commands/ProcessScheduledTransactionsCommand.php` | Novo |
| `app/Http/Controllers/ScheduledTransactionLogController.php` | Novo |
| `app/Observers/TransactionObserver.php` | Modificado |
| `database/migrations/..._create_scheduled_transaction_logs_table.php` | Novo |
| `routes/web.php` | Modificado |
| `routes/console.php` | Modificado |
| `resources/js/Pages/ScheduledLogs/Index.tsx` | Novo |
| `resources/js/Components/TransactionStatusBadge.tsx` | Modificado (se existir) |
| `resources/js/types/models.d.ts` | Modificado |
