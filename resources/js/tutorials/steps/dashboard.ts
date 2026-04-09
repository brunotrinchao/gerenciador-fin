import type { DriveStep } from 'driver.js';

export const dashboardSteps: DriveStep[] = [
  {
    element: '[data-tutorial="dash-balance"]',
    popover: {
      title: 'Saldo Total',
      description: 'Seu saldo consolidado em todas as contas bancárias. Clique para ver o detalhamento por conta.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="dash-debt"]',
    popover: {
      title: 'Dívida de Cartões',
      description: 'Total de faturas abertas nos seus cartões. Fique de olho para não ultrapassar o limite.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="dash-invested"]',
    popover: {
      title: 'Total Investido',
      description: 'Soma de todos os seus investimentos ativos: renda fixa, variável, crypto e outros.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="dash-upcoming"]',
    popover: {
      title: 'Vencimentos Próximos',
      description: 'Quantos pagamentos vencem nos próximos 7 dias. Clique para ver a lista completa e evitar atrasos.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="dash-pie-chart"]',
    popover: {
      title: 'Gastos por Categoria',
      description: 'Gráfico mostrando como seus gastos do mês estão distribuídos. Identifique onde você gasta mais.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="dash-bar-chart"]',
    popover: {
      title: 'Fluxo de Caixa',
      description: 'Comparativo de receitas vs despesas nos últimos meses. Ideal para identificar tendências financeiras.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="dash-payments-list"]',
    popover: {
      title: 'Próximos Pagamentos',
      description: 'Seus compromissos financeiros em ordem cronológica. Mantenha sempre saldo suficiente para cobri-los.',
      side: 'top',
    },
  },
];
