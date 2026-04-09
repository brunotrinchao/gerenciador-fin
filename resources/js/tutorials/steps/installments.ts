import type { DriveStep } from 'driver.js';

export const installmentsSteps: DriveStep[] = [
  {
    element: '[data-tutorial="inst-list"]',
    popover: {
      title: 'Grupos de Parcelas',
      description: 'Cada linha representa uma compra parcelada. Veja quantas parcelas já foram pagas e quantas restam.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="inst-progress"]',
    popover: {
      title: 'Progresso',
      description: 'Barra de progresso mostrando parcelas pagas vs. total. Verde = em dia, vermelho = atrasado.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="inst-remaining"]',
    popover: {
      title: 'Valor Restante',
      description: 'Total que ainda falta pagar nesta compra. Útil para calcular quando você quitará completamente.',
      side: 'left',
    },
  },
];
