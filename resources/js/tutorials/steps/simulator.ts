import type { DriveStep } from 'driver.js';

export const simulatorSteps: DriveStep[] = [
  {
    element: '[data-tutorial="sim-scenario-a"]',
    popover: {
      title: 'Cenário A',
      description: 'Configure o primeiro cenário: valor inicial, aporte mensal, taxa de retorno anual e custos mensais.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="sim-scenario-b"]',
    popover: {
      title: 'Cenário B',
      description: 'Configure o segundo cenário para comparar. Exemplo: "alugar" vs "comprar" ou "CDB" vs "Ações".',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="sim-period"]',
    popover: {
      title: 'Período',
      description: 'Arraste para selecionar o período de simulação, de 6 meses a 10 anos.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="sim-calculate-btn"]',
    popover: {
      title: 'Calcular',
      description: 'Clique para calcular e comparar os dois cenários. O resultado mostra evolução patrimonial e comparativo final.',
      side: 'top',
    },
  },
];
