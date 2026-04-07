# 💰 Gerenciador Financeiro — Sprint 1: Polimento Visual & UX Interativa

> **Data:** 7 de Abril de 2026  
> **Topic:** Sprint 1 — Polimento Visual & UX Interativa  
> **Status:** Draft  
> **Design Decision:** Skeletons Independentes | Termômetro de Limite "Stacked" | Detalhamento via Drawers  

---

## 1. Visão Geral
O objetivo desta sprint é elevar a percepção de qualidade do produto, transformando o Dashboard de uma tela estática em um centro de exploração financeira interativo. Focaremos em eliminar saltos de layout (CLS), melhorar o feedback visual de gastos e parcelas, e facilitar a navegação contextual sem recarregamento de página.

---

## 2. Arquitetura de UI e Componentes

### 2.1 Progressive Loading (Skeleton Screens)
Para evitar a percepção de lentidão e flashes de tela branca (comum em SPAs durante a busca de dados), implementaremos **Skeletons independentes por componente**.

*   **Técnica:** Utilizar classes utilitárias `animate-pulse` do Tailwind CSS sobre formas cinzas (`bg-surface-2`) que mimetizam a estrutura do conteúdo real.
*   **Componentes Alvos:**
    *   `SummaryCardSkeleton`: Placeholder para os cards de saldo, dívida e investimentos.
    *   `ChartSkeleton`: Mockup circular/retangular para gráficos do Recharts.
    *   `TransactionTableSkeleton`: Linhas simuladas para a listagem de transações.
*   **Trigger:** O estado `processing` do Inertia ou carregamento diferido (`deferred props`) disparará a troca para o componente Skeleton.

### 2.2 Cartões de Crédito: "Stacked Termômetro"
A visualização do limite será reformulada para ser "transparente" quanto ao uso presente e futuro.

*   **Composição da Barra (Progress Multi-layer):**
    1.  **Gasto Atual (Vermelho Semântico):** Soma das transações confirmadas/pagas no mês.
    2.  **Parcelas Futuras (Laranja/Translúcido):** Soma de parcelas de `InstallmentGroup` ativas mas não vencidas vinculadas a este cartão.
    3.  **Ajuste de Limite (Bônus):** Exibição do `limit_adjustment` como uma "extensão brilhante" ou borda destacada ao final da barra, visualmente distinta do limite base.
*   **Interatividade:** Tooltip detalhado ao passar o mouse discriminando: `Gasto Atual | Parcelas Futuras | Disponível (Base) | Margem Extra`.

### 2.3 Dashboard Contextual (Drawers/Sheets)
Transformaremos os cards de resumo em gatilhos de exploração rápida.

*   **Ação:** Clicar em qualquer Card de Estatística (Saldo, Dívida, Pagamentos) abrirá um **Drawer (Sheet)** lateral.
*   **Conteúdo dos Drawers:**
    *   **Dívida Total:** Lista de transações `CreditCard` com status `Pending`, agrupadas por cartão, com botões de ação rápida para "Pagar Fatura" ou "Ver Fatura".
    *   **Saldo Total:** Detalhamento do saldo em cada `BankAccount` ativa.
    *   **Próximos Pagamentos:** Lista expandida dos próximos 15 itens a vencer (expandindo a visão resumida do Dashboard).
*   **UX:** O usuário explora os detalhes e fecha o drawer para continuar no Dashboard, sem perda de scroll ou estado.

---

## 3. Fluxo de Dados e Interações

### 3.1 Transições de Navegação
*   As páginas terão transições suaves de entrada e saída (ex: `opacity` e `translate-y`) usando **Framer Motion** para reforçar a fluidez do "App Nativo".

### 3.2 Feedback de Status
*   Utilização de Toasts (Shadcn/UI) para confirmação de ações rápidas dentro dos Drawers (ex: marcar parcela como paga).

---

## 4. Estratégia de Testes e Validação
1.  **Teste Visual:** Validar que os Skeletons não causam "saltos" (Layout Shift) maiores que 5px na troca pelo conteúdo real.
2.  **Teste de Lógica:** Garantir que o cálculo do "Termômetro" some corretamente `Installment` + `Transaction` sem duplicidade de valores.
3.  **Teste de UX:** Confirmar que o fechamento do Drawer mantém o estado (scroll e filtros) do Dashboard original.

---

## 5. Critérios de Aceite
- [ ] Skeletons implementados em Dashboard e CreditCards.
- [ ] Barra de limite do cartão agora mostra 3 segmentos distintos (Gasto, Parcelas Futuras, Bônus).
- [ ] Cards do Dashboard abrem Drawers laterais com listagem detalhada.
- [ ] Drawers possuem botões de ação (ex: Pagar) que funcionam sem fechar o drawer prematuramente.
- [ ] Animações de transição de página ativas em todas as rotas Inertia.
