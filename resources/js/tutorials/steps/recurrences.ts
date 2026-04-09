import type { DriveStep } from 'driver.js';

export const recurrencesSteps: DriveStep[] = [
  {
    element: '[data-tutorial="rec-list"]',
    popover: {
      title: 'Recorrências',
      description: 'Transações configuradas para repetição automática: aluguel, assinaturas, salário, etc.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="rec-frequency"]',
    popover: {
      title: 'Frequência',
      description: 'Mensal, semanal, quinzenal ou anual. O sistema cria a próxima transação automaticamente na data certa.',
      side: 'left',
    },
  },
  {
    element: '[data-tutorial="rec-cancel-btn"]',
    popover: {
      title: 'Cancelar Série',
      description: 'Cancela todas as transações futuras desta recorrência. Transações já pagas não são afetadas.',
      side: 'left',
    },
  },
];
