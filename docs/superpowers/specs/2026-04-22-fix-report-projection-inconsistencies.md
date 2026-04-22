# Design Spec: Correção de Inconsistências em Relatórios e Projeções

Data: 2026-04-22
Status: Draft
Autor: Gemini CLI

## 1. Objetivo
Corrigir discrepâncias nos relatórios financeiros, cálculo de patrimônio líquido e projeções de saldo futuro causadas pelo tratamento incorreto de transferências e omissão de dados pendentes.

## 2. Problemas Identificados
- **Volume Inflado:** Transferências internas (entre contas do próprio usuário) são registradas como `Income` e `Expense`, distorcendo os totais de ganhos e gastos reais.
- **Dívida Oculta:** O cálculo de Patrimônio Líquido ignora parcelas (`Installments`) pendentes, considerando apenas faturas de cartão não pagas.
- **Projeção Cega:** O serviço de projeção ignora transações `Pending` com datas passadas (atrasadas), gerando um saldo futuro irrealmente otimista.
- **Erro de Saldo:** O recálculo automático de saldo bancário não considera transações do tipo `Transfer` como entradas, apenas como saídas.

## 3. Proposta de Solução

### 3.1. Tratamento de Transferências
- Alterar `TransactionController` para salvar transações de transferência com `type = TransactionType::Transfer`.
- Criar um mecanismo (ou usar convenção de descrição/sinal) para identificar entrada vs saída em transferências.
- Atualizar `BankAccount::recalculateBalance` para:
    - Somar `Transfer` se for entrada na conta.
    - Subtrair `Transfer` se for saída da conta.

### 3.2. Relatórios e Saúde Financeira
- **Exclusão de Transferências:** `ReportController` e `FinancialHealthScoreService` devem filtrar transações do tipo `Transfer` ao calcular volumes de Receita e Despesa.
- **Inclusão de Parcelas:** Adicionar a soma de todas as `Installments` com `status = pending` ao cálculo de `totalDebt` (Dívida Total).

### 3.3. Projeção Financeira (`FinancialProjectionService`)
- **Incluir Atrasados:** Alterar a busca de transações pendentes para incluir qualquer data anterior a `endDate`.
- **Agrupamento:** Transações com `date < today` devem ser computadas no primeiro mês da projeção (mês atual).
- **Consistência de Saldo:** O `runningBalance` inicial deve continuar sendo o saldo atual das contas, mas o primeiro mês deve refletir o impacto imediato de tudo que está pendente/atrasado.

## 4. Mudanças Técnicas

### 4.1. Backend (Laravel)
- **`app/Http/Controllers/TransactionController.php`**: Mudar `type` de transferências de `Income`/`Expense` para `Transfer`.
- **`app/Models/BankAccount.php`**: Ajustar `recalculateBalance()` para tratar `Transfer`.
- **`app/Services/FinancialProjectionService.php`**: Ajustar filtros de data e agrupamento de pendências retroativas.
- **`app/Http/Controllers/ReportController.php`**: Adicionar `Installment` ao débito e filtrar `Transfer` dos totais.
- **`app/Services/FinancialHealthScoreService.php`**: Filtrar `Transfer` do cálculo de `savings_rate` e `emergency_fund`.

### 4.2. Frontend (React)
- **`resources/js/Pages/Transactions/Index.tsx`**: Garantir que o formulário de transferência continue funcional com os novos tipos.
- **`resources/js/Pages/Reports/Index.tsx`**: Verificar se os labels de "Receita/Despesa" refletem a exclusão de transferências.

## 5. Plano de Verificação
1. **Teste de Transferência:** Criar transferência de R$ 500 entre Conta A e Conta B.
    - Validar que saldo da Conta A caiu R$ 500.
    - Validar que saldo da Conta B subiu R$ 500.
    - Validar que o "Total de Despesas" do mês no Relatório NÃO aumentou.
2. **Teste de Projeção:** Criar despesa de R$ 1000 pendente com data de ontem.
    - Validar que o saldo projetado para o fim do mês atual reflete essa pendência.
3. **Teste de Patrimônio:** Criar compra parcelada de 10x R$ 100.
    - Validar que a Dívida Total no relatório subiu R$ 1000.
