import type { DriveStep } from 'driver.js';

export const calendarSteps: DriveStep[] = [
  {
    element: '[data-tutorial="cal-grid"]',
    popover: {
      title: 'Calendário Financeiro',
      description: 'Visualize suas transações, vencimentos e recorrências organizados por data no calendário.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="cal-nav"]',
    popover: {
      title: 'Navegação',
      description: 'Use as setas para navegar entre os meses. Clique em um dia para ver os eventos daquele dia.',
      side: 'bottom',
    },
  },
];
