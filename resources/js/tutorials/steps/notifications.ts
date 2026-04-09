import type { DriveStep } from 'driver.js';

export const notificationsSteps: DriveStep[] = [
  {
    element: '[data-tutorial="notif-list"]',
    popover: {
      title: 'Alertas',
      description: 'Alertas proativos sobre vencimentos próximos, saldo baixo, metas atingidas e outros eventos importantes.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="notif-mark-read"]',
    popover: {
      title: 'Marcar como Lida',
      description: 'Clique para marcar uma notificação como lida. Use "Marcar todas como lidas" para limpar tudo de uma vez.',
      side: 'left',
    },
  },
];
