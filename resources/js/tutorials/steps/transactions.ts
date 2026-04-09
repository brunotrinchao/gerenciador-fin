import type { DriveStep } from 'driver.js';

export const transactionsSteps: DriveStep[] = [
  {
    element: '[data-tutorial="tx-summary"]',
    popover: {
      title: 'Resumo do Mês',
      description: 'Receitas, despesas e gastos no cartão do mês selecionado. Acompanhe seu saldo mensal aqui.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="tx-filters"]',
    popover: {
      title: 'Filtros',
      description: 'Filtre por mês, tipo (receita/despesa/transferência), status e pesquise por descrição.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="tx-add-btn"]',
    popover: {
      title: 'Nova Transação',
      description: 'Clique aqui para registrar uma nova receita, despesa, transferência ou lançamento no cartão.',
      side: 'left',
    },
  },
  {
    element: '[data-tutorial="tx-list"]',
    popover: {
      title: 'Lista de Transações',
      description: 'Todas as movimentações do período. Clique no ícone de lápis para editar ou na lixeira para excluir.',
      side: 'top',
    },
  },
];
