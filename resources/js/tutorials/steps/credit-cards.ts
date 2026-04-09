import type { DriveStep } from 'driver.js';

export const creditCardsSteps: DriveStep[] = [
  {
    element: '[data-tutorial="cc-add-btn"]',
    popover: {
      title: 'Novo Cartão',
      description: 'Cadastre um cartão informando nome, limite, dia de fechamento e dia de vencimento da fatura.',
      side: 'left',
    },
  },
  {
    element: '[data-tutorial="cc-card-list"]',
    popover: {
      title: 'Seus Cartões',
      description: 'Todos os seus cartões de crédito. Clique em um cartão para ver os detalhes e faturas.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="cc-limit-bar"]',
    popover: {
      title: 'Limite Disponível',
      description: 'Barra verde = limite livre. Vermelho = limite consumido. O cálculo é feito em tempo real.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="cc-closing-day"]',
    popover: {
      title: 'Datas do Cartão',
      description: 'Fechamento = data em que o ciclo atual encerra. Vencimento = data de pagamento da fatura.',
      side: 'top',
    },
  },
];
