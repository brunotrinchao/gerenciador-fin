# Especificação: Reformulação da Entrada na Projeção Financeira

**Data:** 2026-04-22
**Status:** Aprovado
**Autor:** Gemini CLI

## 1. Objetivo
Ajustar a lógica de projeção financeira para que a "Entrada" seja composta estritamente pelo saldo bancário atual e receitas pendentes. As "Despesas" devem considerar apenas itens não pagos (status `Pending`).

## 2. Requisitos de Dados

### 2.1. Entrada (Receitas/Ingressos)
- **Saldo Real**: O ponto de partida é a soma de `current_balance` de todas as `BankAccount` ativas (`active = true`) pertencentes ao usuário.
- **Receitas Pendentes**: Somente transações do tipo `income` com status `pending`.
- **Tratamento de Atrasos**: Receitas pendentes com data inferior a `today` devem ser agrupadas no mês atual (Mês 1 da projeção).

### 2.2. Saída (Despesas/Egressos)
- **Transações**: Apenas tipos `expense` e `credit_card` com status `pending`.
- **Parcelas**: Apenas `Installment` com status `pending`.
- **Tratamento de Atrasos**: Despesas pendentes vencidas devem ser agrupadas no mês atual para refletir o impacto imediato no caixa.

## 3. Lógica de Cálculo

### 3.1. Acúmulo Mensal
Para cada mês `M` na projeção:
1. `income_monthly` = Σ(Transações Income Pendentes em `M`).
2. `outcome_monthly` = Σ(Despesas Pendentes + Parcelas Pendentes + Faturas Pendentes em `M`).
3. `available_at_start` = (Se M=1: Saldo Bancário + Pendências Atrasadas; Se M>1: Saldo Final de M-1).
4. `final_balance` = `available_at_start` + `income_monthly` - `outcome_monthly`.

## 4. Alterações Técnicas

### 4.1. `FinancialProjectionService.php`
- Refinar queries do Eloquent para garantir exclusividade de status `pending`.
- Revisar loop de acumulação para garantir que `income` não contenha nada além de transações pendentes.

## 5. Critérios de Aceite
- Transações com status `paid` **não** devem ser somadas aos campos `income` ou `expense` (pois já estão no saldo bancário).
- O saldo inicial do primeiro mês deve bater com o total exibido no Dashboard (contas ativas).
- Receitas futuras pendentes devem aparecer no mês de vencimento.
