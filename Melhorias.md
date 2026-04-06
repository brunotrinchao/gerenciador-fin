Toda tela de listagem (transacao, parcelas, faturas, cartoes, contas, investimentos, projecao, relatorios, categorias)
devem ter uma sesao de filtros (ja existe em transacao) de acordo a sua necessidade.

Em fatura: Adicionar os filtro o select dos cartões. ao clicar na fatura devem abrir
um modal com as informacoes basicas: Mes e ano, qual o cartao (nome, ultimo 4 digitos), status, valor e os botoes de pagar, editar ou excluir (sempre que houver uma exclusao no sistema, é preciso uma confirmacao).
Pagando, excluir tem impacto no saldo da conta, limite disponivel, etc.

Calendario: Ao clicar em um dia do calendario, poderemos adicionar uma trasacao.

Em PArcelas: devemos ter filtro para listar o tipo (Fatura, ...). se for fatura aparecer outro filtro sobre o cartao e poder ordenar  
mais proximo a finalizar ou nao. Quando pagamos uma parcela e selecionamos um banco, assim como quando pagamos uma fatura e selecionamos um banco (o banco do cartão ja vem selecionado por padrão), é preciso debitar o valor da conta, assim como adicionar se  
for receitar. o status de pago é que faz esse update das contas. ok?

Boleto: O boleto deve ser tratado como uma transação simples (não parcelada, sem conta bancária obrigatória no cadastro). A conta bancária de débito só é informada no momento do pagamento — igual a qualquer outra transação. Além disso, o parser de boleto deve ter uma factory que detecta o tipo do boleto e extrai campos específicos. Todos os boletos devem salvar o código de barras/linha digitável.

Cartões: Corrija os dados da tela (stats) e adicione filtros. Devemos mostrar 3 cartoes por minha quando a tela for grande.
Vamos criar um componente de cartão de credito como no exemplo (https://ui-docs.viagens.dev/#/component/interactive-paycard e https://ui-docs.viagens.dev/#/component/form-interactive-paycard). Podemos usar as logos em https://github.com/aaronfagan/svg-credit-card-payment-icons.

Contas bancarias: Cartões: Corrija os dados da tela (stats) e adicione filtros. Vamos adicionar na conta o limite do cheque especial, pois se o valor do saldo for menos que 0, é usado o limite. Use icones dos banco para ilustrar melhor (https://github.com/matheuscuba/icones-bancos-brasileiros)

Categoria: Toda categorai deve ter um icone para ilustrala, ou seja, tenha icones (pelo menos uns 50 no minimo) para serem selecionado na ccriacao da categoria. Use icons Material Design Icons (https://pictogrammers.com/library/mdi/).
Refatore o seed das categorias padrão.

Perfil: Refatore, pois temos muitas secoes e acoes melhore a informacao das permissoes com um texto (help) explicando.
Deve ser uma listagem de perfiz podendo editar ou deletar (se nao ouver senhum membro com esse perfil). na listagem quandos membros usam esse perfil de ser mostrado. ao clicar alem de ver as informacoes pode editar e excluir.

Calendario:

- Em calendario, Ao clicar em um botão (google agenda), abre o modal com a lista de pagamentos do mes e selecionamos o que queremos enviar para o google agenda.
- No calendario devemos poder filtar o tipo se ser exibido.
- no item do calendario é preciso adicionar se for fatura o icone de cartao, se for boleto o icone de boleto e se for trasao despesa seta saindo e reseita seta entrando.
- No item do calendario ao passar o ouse por cima deve exibir um tooltip com mais informacoes, como Tipo, valor, data de vencimento e status.
- Remova o botão de importar boleto.

Projeção: Devemos ter um filtro de range para podermos projetar mais ou menos meses. Para isso um date gande picker como no design sistem (https://ui-docs.viagens.dev/#/component/input-date). Quero poder exportar para CSV ou PDF.

Em relatorio quer fluxo de caixa, despesas por categorias, Relatório de Despesas Fixas vs. Variáveis, Relatório de Dívidas e Empréstimos, Relatório de Patrimônio Líquido. Todos devem poder ser exportadpos para CSV ou PDF.

Mobile: Deve ter um botão Float que ao clicar abre mais 2 opcoes a cima dele (Importar, Trasaco) como nessa imagem de exemplo (https://www.jqueryscript.net/images/Material-Floating-Toggle-Menu-Plugin-jQuery-collapzion-js.jpg)

Melbros precisa ser refatorado para esta dentro dos padroes do sistemas.

Outros ajustes:

- Campo de moeda precisa de uma mascara de formatacao para Real
- Dashboard precisa refatorar a sessao de proximos pagamentos para usar a regra do calendario (fatura, boleto,trasacao sem fatura).

- Analise o link (https://ui-docs.viagens.dev/#/) e passe pelas paginas de cada menu. observe o design system. Podemos replicar em nosso sistema?




Plano: Próximos Passos de Melhoria — Backlog Priorizado
                                                                                                                                        
     Contexto                                                                                                                           
                                                                                                                                        
     O sprint anterior entregou: débito/crédito automático no saldo ao pagar fatura/parcela, filtros nas telas de Parcelas e Faturas,   
     modal de detalhes da fatura e boleto como transação com factory pattern.                                                       

     Este documento elenca os próximos itens do Melhorias.md organizados por sprint.

     ---
     Sprint A — Quick Wins (baixo esforço, alto impacto)

     A1. Máscara de moeda (Real)

     Impacto: toda a aplicação — inputs de valor em Transações, Parcelas, Faturas, Cartões, Contas
     Abordagem: usar Intl.NumberFormat com onInput ou biblioteca leve (react-currency-input-field)
     Arquivos: todos os formulários com campo amount / total_amount

     A2. Dashboard — refatorar "Próximos Pagamentos"

     Estado atual: lista simples de transactions dos próximos 7 dias
     Novo comportamento: usar a mesma regra do Calendário — faturas (por due_date), parcelas de conta (por due_date), boletos e
     transações simples (por date) — sem duplicar parcelas de cartão
     Arquivos: app/Http/Controllers/DashboardController.php, resources/js/Pages/Dashboard.tsx

     A3. Calendário — melhorias visuais e UX

     Estado atual: tem tooltip e ícones básicos, falta filtro por tipo e botão de nova transação ao clicar no dia
     Itens:
     - Filtro por tipo (fatura / parcela / transação / receita) na barra superior
     - Ícone de boleto (Receipt) nos eventos do tipo boleto
     - Remover botão "Importar Boleto" do calendário (se houver)
     - Ao clicar em um dia vazio → abrir modal de nova transação com a data pré-preenchida
     Arquivos: app/Http/Controllers/CalendarController.php, resources/js/Pages/Calendar.tsx

     ---
     Sprint B — Categorias com Ícones MDI

     B1. Seletor visual de ícones (Material Design Icons)

     Estado atual: campo de texto simples, sem renderização visual do ícone
     Novo comportamento:
     - Grid de ícones para seleção no formulário de categoria (mínimo 50 opções)
     - Usar @mdi/react + @mdi/js ou SVGs inline do pictogrammers.com/library/mdi
     - Exibir ícone selecionado ao lado do nome em toda a app (lista, calendário, transações)
     Arquivos: resources/js/Pages/Categories/Index.tsx, componentes que renderizam categorias

     B2. Refatorar seed de categorias padrão

     Estado atual: CategorySeeder com categorias sem ícone
     Novo: adicionar icon MDI para cada categoria padrão
     Arquivo: database/seeders/CategorySeeder.php

     ---
     Sprint C — Contas Bancárias

     C1. Campo de cheque especial (limite negativo)

     Estado atual: sem campo de limite
     Novo: campo overdraft_limit na conta — quando saldo < 0, usa o cheque especial; exibir indicador visual
     Arquivos: migration nova, app/Models/BankAccount.php, resources/js/Pages/BankAccounts/Index.tsx, Form Request

     C2. Ícones dos bancos brasileiros

     Fonte: https://github.com/matheuscuba/icones-bancos-brasileiros
     Abordagem: mapear bank_code → ícone SVG; fallback para ícone genérico
     Arquivos: componente BankIcon.tsx, tela de contas

     C3. Filtros na tela de contas

     Itens: filtro por tipo de conta (corrente / poupança / investimento / etc)

     ---
     Sprint D — Cartões de Crédito

     D1. Layout 3 colunas em telas grandes

     Estado atual: 2 colunas máximo
     Mudança: grid-cols-3 em lg:

     D2. Corrigir stats do topo

     Verificar se os valores de limite total e disponível estão corretos (cálculo dinâmico vs estático)

     D3. Componente visual de cartão de crédito

     Referência: https://ui-docs.viagens.dev/#/component/interactive-paycard
     Logos: https://github.com/aaronfagan/svg-credit-card-payment-icons
     Abordagem: componente CreditCardVisual.tsx com flip animado, logo da bandeira e gradiente por cor do cartão

     ---
     Sprint E — Projeção e Relatórios

     E1. Projeção — date range picker + export

     Estado atual: hardcoded 12 meses, sem export
     Novo: slider/select de 1 a 24 meses; botões "Exportar CSV" e "Exportar PDF"
     Arquivos: app/Http/Controllers/ProjectionController.php, resources/js/Pages/Projection.tsx

     E2. Relatórios — novos módulos

     Módulos:
     1. Fluxo de Caixa mensal
     2. Despesas por Categoria (pie chart + tabela)
     3. Despesas Fixas vs Variáveis
     4. Dívidas e Empréstimos (parcelas em aberto)
     5. Patrimônio Líquido (contas + investimentos - dívidas)

     Todos com export CSV e PDF (barryvdh/laravel-dompdf para PDF server-side ou jsPDF client-side)

     ---
     Sprint F — Mobile e UX Global

     F1. FAB (Floating Action Button) no mobile

     Referência: https://www.jqueryscript.net/images/Material-Floating-Toggle-Menu-Plugin-jQuery-collapzion-js.jpg
     Comportamento: botão flutuante no canto inferior direito → ao clicar expande 2 opções acima (Importar / Nova Transação)
     Arquivo: resources/js/Layouts/AppLayout.tsx

     F2. Perfil — listagem e gestão

     Estado atual: tela única sem listagem
     Novo: listar perfis, mostrar quantos membros usam cada perfil, editar/deletar (só se não houver membros)

     F3. Membros — refatorar para padrões do sistema

     Estado atual: fora dos padrões visuais
     Novo: aplicar layout, filtros e ações consistentes com o restante do sistema

     ---
     Ordem de execução sugerida

     ┌────────┬───────────────────────────────────────────────────────┬─────────┬─────────┐
     │ Sprint │                         Itens                         │ Esforço │ Impacto │
     ├────────┼───────────────────────────────────────────────────────┼─────────┼─────────┤
     │ A      │ Máscara moeda + Dashboard + Calendário                │ Baixo   │ Alto    │
     ├────────┼───────────────────────────────────────────────────────┼─────────┼─────────┤
     │ B      │ Categorias com ícones MDI                             │ Médio   │ Alto    │
     ├────────┼───────────────────────────────────────────────────────┼─────────┼─────────┤
     │ C      │ Contas bancárias (cheque especial + ícones + filtros) │ Médio   │ Médio   │
     ├────────┼───────────────────────────────────────────────────────┼─────────┼─────────┤
     │ D      │ Cartões (layout + stats + visual)                     │ Alto    │ Médio   │
     ├────────┼───────────────────────────────────────────────────────┼─────────┼─────────┤
     │ E      │ Projeção + Relatórios                                 │ Alto    │ Alto    │
     ├────────┼───────────────────────────────────────────────────────┼─────────┼─────────┤
     │ F      │ Mobile FAB + Perfil + Membros                         │ Médio   │ Médio   │
     └────────┴───────────────────────────────────────────────────────┴─────────┴─────────┘

     ---
     Verificação (por sprint)

     - A: Dashboard mostra faturas vencendo nos próximos 7 dias; calendário filtra por tipo; nova transação com data do dia ao clicar
     - B: Ícone MDI aparece na lista, no calendário e no formulário; seed atualizado
     - C: Saldo negativo usa cheque especial; ícone do banco aparece na lista
     - D: 3 cartões por linha em lg; limite disponível correto
     - E: Projeção com 6 meses funciona; CSV baixa corretamente
     - F: FAB aparece no mobile; ao expandir mostra 2 opções



     COrreções:
     - Ao editar um cartao (limite) o uso não é atualizado (load)
     -. parcelas é basicamente o relatorio de dividas. então remova a sessao de parcelas
     - Em perfil quero poder editar o perfil.
     - Em perfil quero poder dar ou nao permissao para as configuracoes (categoria), relatorio, etc.
     - Em configuracoes, adicionar uma opcao de limpar dados. isso reiniciara o sistyema sem os dados. Abrira um modal de confirmacao antes de limpar. e em seguida a cada etapa de limpeza vai mostrando, assim como é feito na importcao.