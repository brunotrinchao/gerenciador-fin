# Gerenciador Financeiro Pessoal — Contexto do Projeto

## Visão Geral

Aplicação web pessoal para controle financeiro completo. O objetivo central é **previsibilidade**: o usuário deve saber exatamente quanto tem hoje e quanto terá nos próximos meses, considerando parcelas, cartões, financiamentos e investimentos.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Laravel 11 (PHP 8.3+) |
| Bridge SPA | Inertia.js v2 |
| Frontend | React 19 + TypeScript |
| Estilo | Tailwind CSS 3 + shadcn/ui |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| ORM | Eloquent (built-in Laravel) |
| Banco | Supabase — PostgreSQL |
| Auth | Laravel Sanctum + Socialite (Google OAuth) |
| Filas | Laravel Queues (processamento async de PDF) |
| Storage | Laravel Storage (faturas e extratos) |
| IA | Google Gemini 1.5 Flash (free tier) |
| Deploy | Railway (backend) + Supabase (DB) |
| Testes | Pest PHP |

**Não existe API REST separada.** Inertia.js conecta Laravel e React no mesmo projeto. Controllers retornam `Inertia::render()`, nunca `response()->json()`. Rotas ficam todas em `routes/web.php`.

---

## Arquitetura

```
routes/web.php
    └── Controllers (retornam Inertia::render)
            └── Services (regras de negócio)
                    └── Models Eloquent (banco)

resources/js/
    └── Pages/      ← Componentes React (recebem props do Controller)
    └── Components/ ← Componentes reutilizáveis
    └── Layouts/    ← AppLayout, AuthLayout
```

---

## Domínio — Entidades Principais

- **BankAccount** — contas bancárias com saldo calculado
- **CreditCard** — cartões com limite, closing_day e due_day
- **Transaction** — toda movimentação financeira (income, expense, credit_card, transfer, investment_in, investment_out)
- **InstallmentGroup** — agrupamento de uma compra parcelada
- **Installment** — cada parcela individual de um grupo
- **CreditCardStatement** — fatura de cartão (pode ser importada via PDF/CSV/OFX)
- **Investment** — aplicações financeiras (renda fixa, renda variável, crypto, etc.)
- **InvestmentSnapshot** — histórico de saldo de investimento
- **Category** — categorias de transações (income ou expense, com subcategorias)
- **Budget** — orçamento mensal por categoria

---

## Regras de Negócio Críticas

### Saldo de Conta
O `current_balance` é recalculado via `TransactionObserver` a cada create/update/delete de transação. Nunca calcular na mão — usar `$account->recalculateBalance()`.

### Parcelas
- Criar parcelamento → N transações + N installments criados automaticamente via `InstallmentService::create()`
- Datas calculadas por `closing_day` e `due_day` do cartão
- Arredondamento vai na **última** parcela
- Cancelar → só cancela parcelas `pending`, preserva `paid`

### Importação de Fatura
Fluxo assíncrono via Job `ProcessStatementImport`:
1. Upload → cria `CreditCardStatement` (status: `processing`)
2. Job roda em background: parse → detecta duplicatas → categoriza via IA
3. Statement muda para `review_pending`
4. Usuário revisa na tela → confirma ou rejeita cada item
5. Confirmação → salva transações aprovadas + faz match com parcelas existentes

**Hash de duplicata:** `SHA256(date|amount_cents|normalized_description)`
- Duplicata exata: hash idêntico → skip automático
- Duplicata incerta: mesmo valor + data ±3 dias + similaridade > 80% → revisão

### Limite do Cartão
`available_limit = credit_limit - Σ(transactions.amount WHERE status != paid AND ciclo atual)`
Calculado dinamicamente, nunca armazenado estaticamente (ou recalculado no Observer).

---

## Convenções de Código

### PHP / Laravel
- Usar **PHP Enums** para tipos: `TransactionType`, `TransactionStatus`, `InstallmentStatus`, `InvestmentType`, `AccountType`
- **Form Requests** para toda validação — nunca validar no Controller diretamente
- **Services** para lógica de negócio complexa — Controllers devem ser finos
- **Scopes** no Model para queries recorrentes: `scopeByUser`, `scopePending`, `scopeCurrentMonth`, `scopeExpenses`, `scopeIncomes`
- **Accessors** no Model para campos calculados: `getProgressAttribute`, `getTotalRemainingAttribute`, `getIsOverdueAttribute`
- **Observers** para side effects: `TransactionObserver` (recalcula saldo), nunca lógica inline no Controller
- Nomear migrations no padrão: `2026_01_01_000001_create_bank_accounts_table.php`
- Sempre usar `auth()->id()` para filtrar dados do usuário autenticado — nunca retornar dados de outros usuários

### TypeScript / React
- Definir interfaces dos Models em `resources/js/types/models.d.ts`
- Usar `useForm` do Inertia (`import { useForm } from '@inertiajs/react'`) para formulários com submit — não axios
- Usar `router.patch/delete` do Inertia para ações sem formulário
- Componentes de página ficam em `resources/js/Pages/` e recebem props tipadas
- Componentes reutilizáveis em `resources/js/Components/`
- Usar `route()` helper do Ziggy para gerar URLs no frontend

### Banco de Dados
- Chaves primárias: `bigint` auto-increment (não UUID)
- Valores monetários: `decimal(15, 2)` — nunca float
- Datas sem hora: `date` — datas com hora: `timestamp`
- Soft deletes apenas em entidades principais (Transaction, InstallmentGroup, Investment)
- Índices obrigatórios: `user_id` em todas as tabelas, `import_hash` em transactions, `(credit_card_id, reference_month)` em statements

---

## Estrutura de Pastas Relevante

```
app/
├── Enums/                  ← PHP Enums para tipos e status
├── Http/
│   ├── Controllers/        ← Finos, delegam para Services
│   └── Requests/           ← Validação (Form Requests)
├── Jobs/
│   └── ProcessStatementImport.php
├── Models/                 ← Eloquent com scopes e accessors
├── Observers/
│   └── TransactionObserver.php
└── Services/
    ├── Import/             ← PdfParser, CsvParser, DuplicateDetector
    ├── InstallmentService.php
    ├── FinancialProjectionService.php
    └── AI/GeminiService.php

resources/js/
├── Pages/                  ← Componentes de página (Inertia)
├── Components/             ← Componentes reutilizáveis
│   └── ui/                 ← shadcn/ui (não editar manualmente)
├── Layouts/
│   └── AppLayout.tsx       ← Sidebar + Header
└── types/
    └── models.d.ts         ← Interfaces TypeScript dos Models

routes/web.php              ← TODAS as rotas (sem api.php)
database/
├── migrations/
└── seeders/
    └── CategorySeeder.php  ← Categorias padrão (não excluir)
```

---

## Serviços Externos

| Serviço | Uso | Config |
|---------|-----|--------|
| Supabase | PostgreSQL (banco principal) | `DATABASE_URL` no `.env` |
| Google Gemini | IA: categorização, chat, análise | `GEMINI_API_KEY` no `.env` |
| Google OAuth | Login social | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |
| Laravel Storage | PDFs e CSVs de faturas | `FILESYSTEM_DISK=local` (dev) / `s3` (prod) |

### Fallback de IA
Se o Gemini não responder, o sistema deve degradar graciosamente: importação continua sem categoria sugerida, categoria fica como `null` e o usuário categoriza manualmente. **Nunca bloquear o fluxo principal por falha da IA.**

---

## Comandos Úteis

```bash
# Instalar dependências
composer install
npm install

# Migrations e seeds
php artisan migrate
php artisan db:seed --class=CategorySeeder

# Rodar localmente
php artisan serve
npm run dev

# Queue worker (necessário para importação de faturas)
php artisan queue:work

# Testes
php artisan test
./vendor/bin/pest

# Criar componente shadcn
npx shadcn@latest add button
npx shadcn@latest add dialog

# Gerar tipos Ziggy para o frontend
php artisan ziggy:generate
```

---

## Módulos e Status

| Módulo | Descrição | Sprint |
|--------|-----------|--------|
| Auth | Google OAuth + session | Sprint 1 |
| Contas Bancárias | CRUD + saldo calculado | Sprint 1 |
| Categorias | CRUD + padrões via Seeder | Sprint 1 |
| Transações | CRUD + transferências | Sprint 2 |
| Cartões | CRUD + limites dinâmicos | Sprint 3 |
| Parcelamentos | Criação automática de N parcelas | Sprint 3 |
| Importação | PDF/CSV/OFX + detecção de duplicatas | Sprint 4 |
| Dashboard | Gráficos + resumo financeiro | Sprint 5 |
| Investimentos | CRUD + snapshots + resgate | Sprint 6 |
| Projeção | Fluxo de caixa futuro 12 meses | Sprint 7 |
| IA | Gemini: categorização + chat + análise | Sprint 8 |
| Relatórios | Filtros + export CSV | Sprint 9 |

---

## Documento de Referência

O plano completo de desenvolvimento (ERD, diagramas UML, regras de negócio detalhadas, design de rotas e estimativas) está em:

```
PLANO_DESENVOLVIMENTO.md
```

---

*Projeto pessoal — Bruno Souza — bruno.souza@onfly.com.br*
