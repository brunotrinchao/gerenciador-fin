import type { DriveStep } from 'driver.js';

export const projectionSteps: DriveStep[] = [
  {
    element: '[data-tutorial="proj-chart"]',
    popover: {
      title: 'Gráfico de Projeção',
      description: 'Evolução do seu saldo nos próximos 12 meses considerando receitas, despesas e recorrências.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="proj-table"]',
    popover: {
      title: 'Tabela Mensal',
      description: 'Detalhamento mês a mês: saldo inicial, entradas, saídas e saldo final projetado.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="proj-export"]',
    popover: {
      title: 'Exportar',
      description: 'Baixe a projeção em CSV para análise em planilhas ou para compartilhar com seu contador.',
      side: 'left',
    },
  },
];
