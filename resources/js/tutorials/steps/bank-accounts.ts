import type { DriveStep } from 'driver.js';

export const bankAccountsSteps: DriveStep[] = [
  {
    element: '[data-tutorial="ba-add-btn"]',
    popover: {
      title: 'Nova Conta',
      description: 'Cadastre uma conta bancária informando nome, banco, tipo (corrente/poupança) e saldo inicial.',
      side: 'left',
    },
  },
  {
    element: '[data-tutorial="ba-account-list"]',
    popover: {
      title: 'Suas Contas',
      description: 'Todas as suas contas bancárias com saldo atual. O saldo é recalculado automaticamente a cada transação.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="ba-balance"]',
    popover: {
      title: 'Saldo Calculado',
      description: 'Este saldo é calculado somando todas as transações confirmadas da conta. É sempre preciso.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="ba-total"]',
    popover: {
      title: 'Saldo Total',
      description: 'Soma de todas as suas contas bancárias. Representa seu patrimônio líquido em conta.',
      side: 'bottom',
    },
  },
];
