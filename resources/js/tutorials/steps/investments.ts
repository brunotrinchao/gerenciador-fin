import type { DriveStep } from 'driver.js';

export const investmentsSteps: DriveStep[] = [
  {
    element: '[data-tutorial="inv-summary"]',
    popover: {
      title: 'Resumo da Carteira',
      description: 'Total investido, rendimento acumulado e rentabilidade percentual da sua carteira completa.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="inv-add-btn"]',
    popover: {
      title: 'Novo Investimento',
      description: 'Cadastre um investimento informando tipo (renda fixa, ações, crypto, etc.), valor e taxa de retorno.',
      side: 'left',
    },
  },
  {
    element: '[data-tutorial="inv-list"]',
    popover: {
      title: 'Seus Investimentos',
      description: 'Lista de todos os seus ativos. Veja valor atual, rendimento e data de vencimento (renda fixa).',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="inv-snapshot-btn"]',
    popover: {
      title: 'Registrar Snapshot',
      description: 'Registre o valor atual do investimento. Cria um histórico que aparece no gráfico de evolução.',
      side: 'left',
    },
  },
  {
    element: '[data-tutorial="inv-redeem-btn"]',
    popover: {
      title: 'Resgatar',
      description: 'Registre um resgate total ou parcial do investimento. O valor é creditado em uma conta bancária.',
      side: 'left',
    },
  },
];
