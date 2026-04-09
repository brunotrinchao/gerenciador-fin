import type { DriveStep } from 'driver.js';

export const invoicesSteps: DriveStep[] = [
  {
    element: '[data-tutorial="inv-month-filter"]',
    popover: {
      title: 'Filtro de Mês',
      description: 'Navegue entre os meses para ver as faturas de cada período. Use as setas para avançar ou voltar.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="inv-add-btn"]',
    popover: {
      title: 'Nova Fatura',
      description: 'Crie uma fatura manualmente informando cartão, mês de referência e valor total.',
      side: 'left',
    },
  },
  {
    element: '[data-tutorial="inv-import-btn"]',
    popover: {
      title: 'Importar Fatura',
      description: 'Importe faturas automaticamente via PDF, CSV ou OFX do seu banco. O sistema detecta duplicatas.',
      side: 'left',
    },
  },
  {
    element: '[data-tutorial="inv-card-list"]',
    popover: {
      title: 'Faturas por Cartão',
      description: 'Cada card representa a fatura de um cartão. Veja o valor total, vencimento e status de pagamento.',
      side: 'top',
    },
  },
];
