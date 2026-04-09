import type { DriveStep } from 'driver.js';

export const taxPlanningSteps: DriveStep[] = [
  {
    element: '[data-tutorial="tax-add-btn"]',
    popover: {
      title: 'Adicionar Imposto',
      description: 'Cadastre um imposto (IPVA, IPTU, IRPF ou outro) com valor total, número de parcelas e vencimentos.',
      side: 'left',
    },
  },
  {
    element: '[data-tutorial="tax-list"]',
    popover: {
      title: 'Seus Impostos',
      description: 'Lista de todos os impostos agendados por ano. Clique na lixeira para remover um registro.',
      side: 'top',
    },
  },
];
