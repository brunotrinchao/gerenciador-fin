# Design: Backup e Restauração de Dados — RASCUNHO (em pausa)

**Data:** 2026-04-09  
**Status:** ⏸️ Suspenso — brainstorming em andamento, não iniciado

---

## Decisões já tomadas

| Pergunta | Decisão |
|---|---|
| Comportamento do restore | **(B)** Limpa tudo (exceto admin + categorias padrão) e restaura do zero |
| Geração do backup | **(B)** Assíncrono com Job — polling no frontend |
| Formato do zip | **(A)** 1 arquivo JSON por entidade, em ordem de dependência |
| Upload para restore | **(A)** Upload do `.zip` inteiro — sistema cuida de tudo |
| Abordagem arquitetural | **Opção 1** — Job único com modelo de progresso (`BackupRestoreJob`) |

---

## Estrutura do zip (decidida)

```
backup_YYYY-MM-DD_HHmmss.zip
├── manifest.json
├── 1-categories.json
├── 2-bank_accounts.json
├── 3-credit_cards.json
├── 4-installment_groups.json
├── 5-transactions.json
├── 6-installments.json
├── 7-credit_card_statements.json
├── 8-investments.json
├── 9-investment_snapshots.json
└── 10-budgets.json
```

---

## Próximos passos (quando retomar)

1. Apresentar design detalhado — Seção 1: Arquitetura + Data Layer (`BackupRestoreJob` model/table)
2. Seção 2: Backend Services + Jobs + Rotas
3. Seção 3: Frontend (progresso, upload, polling)
4. Aprovação → escrever spec completo → invocar writing-plans

---

## Contexto do projeto relevante

- Settings page já existe: `resources/js/Pages/Settings/Index.tsx` (382 linhas)
- Já existe `ClearDataModal` e rota `DELETE /settings/clear-data` → `ClearDataController`
- Padrão de Job assíncrono: `ProcessStatementImport.php` (referência de implementação)
- Sidebar: seção "Configurações" → "Geral" (onde o backup/restore vai aparecer)
- 14 models no projeto — 10 precisam de backup (excluindo User, Role, Invite, ScheduledTransactionLog)
