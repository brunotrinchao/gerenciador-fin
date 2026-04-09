# Spec: Edição e Exclusão de Parcelas com Controle de Escopo

**Data:** 2026-04-09  
**Status:** Design Validado  
**Objetivo:** Permitir que o usuário edite ou exclua parcelas de uma transação individualmente ou em lote, utilizando um modal de escolha de escopo idêntico ao de transações recorrentes.

---

## 1. Arquitetura e Fluxo de Dados

### 1.1 Backend (Laravel)

#### `InstallmentService.php`
Expandir o serviço para gerenciar edições e exclusões em lote para parcelamentos:
- **`updateSeries(Transaction $transaction, array $data, string $scope)`**:
    - Identifica o `installment_group_id`.
    - Resolve os alvos com base no `number` da parcela atual:
        - `only_this`: Apenas a transação e o registro de parcela (`Installment`) vinculados.
        - `this_and_future`: Parcelas do mesmo grupo com `number >=` que a parcela atual.
        - `all`: Todas as parcelas do grupo.
    - **Sincronização de Campos:** Atualiza `description`, `amount`, `category_id`, `bank_account_id` e `notes`.
    - **Preservação de Datas:** O campo `date` da transação e `due_date` da parcela **não** devem ser alterados em lote para manter o cronograma original.
    - **Integridade:** Garante que o `amount` na `Transaction` e na `Installment` permaneça idêntico.

- **`deleteSeries(Transaction $transaction, string $scope)`**:
    - Localiza as transações e parcelas alvo seguindo a mesma lógica de resolução de escopo.
    - Executa a exclusão (soft delete se aplicável) em cascata.

#### `TransactionController.php`
Ajustar os métodos `update` e `destroy` para rotear a lógica corretamente:
- Detectar se a transação possui `installment_group_id`.
- Se sim, delegar para `InstallmentService->updateSeries()` ou `deleteSeries()` passando o `recurrence_scope` recebido na requisição.

---

### 1.2 Frontend (React / Inertia)

#### `resources/js/Pages/Transactions/Index.tsx`
- **Intercepção de Ações:**
    - `openEdit`: Se a transação tiver `installment_group_id`, abrir o `RecurrenceScopeModal`.
    - `handleDeleteClick`: Se a transação tiver `installment_group_id`, abrir o `RecurrenceScopeModal`.
- **Adaptação do Modal de Escopo:**
    - O `RecurrenceScopeModal` deve detectar se o item é uma parcela para exibir labels amigáveis:
        - "Editar/Excluir parcelas" em vez de "transação recorrente".
        - "Só esta parcela", "Esta e as futuras parcelas", "Todas as parcelas".
- **Envio de Dados:**
    - Na edição: Passar o escopo para o `TransactionFormModal` e incluí-lo no payload do `router.patch`.
    - Na exclusão: Passar o escopo diretamente no payload do `router.delete`.

---

## 2. Regras de Negócio e Casos de Borda

### 2.1 Sincronização e Arredondamento
- Se o `amount` de um grupo de parcelas for alterado em lote, o valor total do `InstallmentGroup` (`total_amount`) deve ser recalculado no banco de dados.
- O sistema deve manter a coerência visual: ao alterar "Todas", todas as parcelas assumem o novo valor. Não haverá recalculo de arredondamento dinâmico na última parcela durante a *edição* em lote para evitar confusão (o valor digitado será soberano para todas as selecionadas).

### 2.2 Status de Pagamento
- **Proteção:** Transações com status `paid` (Pagas) **não** devem ser alteradas por edições em lote, a menos que o escopo seja explicitamente `only_this` sobre a própria transação paga. Isso evita que mudanças em parcelas futuras desfaçam o histórico financeiro já consolidado.

### 2.3 Relacionamento Installment <-> Transaction
- Toda `Transaction` que possui `installment_group_id` tem um `Installment` correspondente. A edição de um deve refletir no outro para manter a integridade do banco de dados.

---

## 3. Plano de Testes (Verificação)

- **Cenário 1: Edição Única**
    - Editar uma parcela de 10x (apenas "Esta"). Verificar se apenas ela mudou de valor e descrição.
- **Cenário 2: Edição "Esta e as Futuras"**
    - Editar a parcela 5 de 10. Verificar se as parcelas 5 a 10 foram atualizadas e as 1 a 4 permaneceram intactas.
- **Cenário 3: Exclusão "Todas"**
    - Excluir um parcelamento completo. Verificar se o `InstallmentGroup`, todas as `Installments` e todas as `Transactions` vinculadas sumiram da listagem.
- **Cenário 4: Preservação de Pagas**
    - Tentar editar "Todas" as parcelas de um grupo onde a parcela 1 já está paga. Verificar se o valor da parcela 1 não mudou.
