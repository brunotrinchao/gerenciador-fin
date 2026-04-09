# New Features — Backlog

> Gerado em: 2026-04-09
> Status: Backlog — aguardando priorização

---

## 🟢 Alto impacto, baixo esforço

### [ ] 1. Metas Financeiras
O usuário define metas ("Reserva de emergência: R$ 20k", "Viagem: R$ 5k") vinculadas a uma conta ou investimento. Barra de progresso no dashboard, projeção de quando vai atingir baseada no histórico de aportes.
- **Inspiração:** YNAB Goals
- **Esforço:** 🔨🔨
- **Impacto:** ⭐⭐⭐⭐⭐

---

### [ ] 2. Alertas Proativos (e-mail / push)
Notificações automáticas via fila existente: saldo abaixo de X, conta a vencer em 3 dias, cartão próximo do limite, meta atingida.
- **Infra necessária:** Jobs + Mailer (já existem no projeto)
- **Esforço:** 🔨
- **Impacto:** ⭐⭐⭐⭐

---

### [ ] 3. Dashboard de Patrimônio Líquido (Net Worth)
Gráfico mensal de `total_investimentos + total_contas - total_dívidas`. Linha do tempo da evolução patrimonial. Os dados já existem — é apresentação consolidada.
- **Esforço:** 🔨
- **Impacto:** ⭐⭐⭐⭐

---

### [ ] 4. Recorrências Avançadas
Tela dedicada de "Compromissos Fixos" mostrando todos os recorrentes com status (ativo/pausado), próxima data e valor médio. O campo `is_recurring` já existe no model.
- **Inspiração:** Copilot Recurrings
- **Esforço:** 🔨🔨
- **Impacto:** ⭐⭐⭐⭐

---

## 🟡 Alto impacto, esforço médio

### [ ] 5. Análise de Gastos por IA (Gemini)
Relatório mensal automático gerado pelo Gemini com insights personalizados: variações por categoria, tendências, comparativo com meses anteriores.
- **Infra necessária:** GeminiService já integrado
- **Esforço:** 🔨🔨
- **Impacto:** ⭐⭐⭐⭐⭐

---

### [ ] 6. Modo Casal / Família
Transações compartilhadas com visão consolidada. Cada pessoa mantém contas individuais mas há dashboard conjunto.
- **Infra necessária:** Roles/Members já existem no projeto
- **Esforço:** 🔨🔨🔨
- **Impacto:** ⭐⭐⭐⭐

---

### [ ] 7. Planejamento de Impostos Brasileiros (IPVA, IPTU, IRPF)
Cadastro de impostos anuais com parcelas geradas automaticamente no início do ano. Alertas de vencimento. Integra com o sistema de parcelamentos existente.
- **Contexto:** 🇧🇷 Específico Brasil
- **Esforço:** 🔨🔨
- **Impacto:** ⭐⭐⭐⭐

---

### [ ] 8. Score de Saúde Financeira
Indicador 0-100 baseado em: índice de poupança, uso do limite do cartão, cobertura de emergência, cumprimento do orçamento. Atualizado mensalmente.
- **Esforço:** 🔨🔨
- **Impacto:** ⭐⭐⭐

---

## 🔴 Alto impacto, esforço alto

### [ ] 9. Open Finance / PIX Automático
Sincronização bancária real via Open Finance (Pluggy/Belvo). Transações chegam automaticamente. PIX Automático via Banco Central para débito automático real.
- **Dependência:** Parceria com agregador bancário (Pluggy/Belvo)
- **Contexto:** 🇧🇷 Específico Brasil
- **Esforço:** 🔨🔨🔨🔨🔨
- **Impacto:** ⭐⭐⭐⭐⭐

---

### [ ] 10. Simulador de Decisões Financeiras
"Se eu pagar a dívida do cartão agora vs. investir, qual cenário é melhor em 12 meses?" Interface de simulação com variáveis ajustáveis sobre o `FinancialProjectionService` já existente.
- **Infra necessária:** FinancialProjectionService (já existe)
- **Esforço:** 🔨🔨🔨
- **Impacto:** ⭐⭐⭐⭐

---

### [ ] 11. Importação Automática de NF-e / Extratos
Leitura de XML de Nota Fiscal Eletrônica para categorizar compras automaticamente. Expansão do OFX já parcialmente implementado para mais bancos e formatos.
- **Esforço:** 🔨🔨🔨
- **Impacto:** ⭐⭐⭐

---

### [ ] 12. App Mobile (PWA ou React Native)
Interface responsiva para mobile ou app nativo. A maioria dos brasileiros gerencia finanças pelo celular.
- **Esforço:** 🔨🔨🔨🔨
- **Impacto:** ⭐⭐⭐⭐⭐

---

## 🇧🇷 Específico para o mercado brasileiro

### [ ] 13. Controle de 13º Salário e Férias
Planejamento de recebimento do 13º e férias — valor esperado, data, distribuição automática entre metas e dívidas.
- **Esforço:** 🔨🔨
- **Impacto:** ⭐⭐⭐⭐

---

### [ ] 14. Relatório para Declaração de IRPF
Relatório anual formatado para facilitar o preenchimento do IRPF: rendimentos, deduções por categoria, rendimentos de investimentos.
- **Esforço:** 🔨🔨
- **Impacto:** ⭐⭐⭐⭐

---

### [ ] 15. Controle de FGTS
Rastrear saldo de FGTS separado dos investimentos, com projeção de saque em casos de demissão ou compra de imóvel.
- **Esforço:** 🔨🔨
- **Impacto:** ⭐⭐⭐

---

## Backup & Restore (em pausa)

### [ ] 16. Backup e Restauração de Dados
Exportar todos os dados em `.zip` com arquivos JSON por etapa. Restaurar a partir do zip com sistema limpo. Progresso em tempo real no frontend.
- **Spec parcial:** `docs/superpowers/specs/2026-04-09-backup-restore-RASCUNHO.md`
- **Status:** ⏸️ Design iniciado — retomar quando conveniente
- **Esforço:** 🔨🔨🔨
- **Impacto:** ⭐⭐⭐⭐

---

## Resumo de Priorização Sugerida

| # | Feature | Impacto | Esforço | Prioridade |
|---|---------|---------|---------|------------|
| 3 | Dashboard Net Worth | ⭐⭐⭐⭐ | 🔨 | 🥇 |
| 2 | Alertas Proativos | ⭐⭐⭐⭐ | 🔨 | 🥇 |
| 1 | Metas Financeiras | ⭐⭐⭐⭐⭐ | 🔨🔨 | 🥇 |
| 5 | Análise IA Mensal | ⭐⭐⭐⭐⭐ | 🔨🔨 | 🥇 |
| 7 | Impostos BR | ⭐⭐⭐⭐ | 🔨🔨 | 🥈 |
| 4 | Recorrências Avançadas | ⭐⭐⭐⭐ | 🔨🔨 | 🥈 |
| 8 | Score Saúde Financeira | ⭐⭐⭐ | 🔨🔨 | 🥈 |
| 13 | 13º e Férias | ⭐⭐⭐⭐ | 🔨🔨 | 🥈 |
| 14 | Relatório IRPF | ⭐⭐⭐⭐ | 🔨🔨 | 🥈 |
| 10 | Simulador Decisões | ⭐⭐⭐⭐ | 🔨🔨🔨 | 🥉 |
| 6 | Modo Casal/Família | ⭐⭐⭐⭐ | 🔨🔨🔨 | 🥉 |
| 11 | Importação NF-e | ⭐⭐⭐ | 🔨🔨🔨 | 🥉 |
| 16 | Backup & Restore | ⭐⭐⭐⭐ | 🔨🔨🔨 | 🥉 |
| 12 | App Mobile | ⭐⭐⭐⭐⭐ | 🔨🔨🔨🔨 | 🏁 |
| 15 | FGTS | ⭐⭐⭐ | 🔨🔨 | 🏁 |
| 9 | Open Finance | ⭐⭐⭐⭐⭐ | 🔨🔨🔨🔨🔨 | 🏁 |
