import type { DriveStep } from 'driver.js';

export const reportsSteps: DriveStep[] = [
  {
    element: '[data-tutorial="rep-tabs"]',
    popover: {
      title: 'Relatórios',
      description: 'Navegue entre os relatórios disponíveis: Fluxo de Caixa, Despesas por Categoria, Fixas vs Variáveis e Patrimônio.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="rep-charts"]',
    popover: {
      title: 'Gráficos',
      description: 'Visualizações dos seus dados financeiros: gastos por categoria, evolução mensal e comparativos.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="rep-export"]',
    popover: {
      title: 'Exportar CSV',
      description: 'Baixe os dados filtrados em CSV para análise em planilhas do Excel ou Google Sheets.',
      side: 'left',
    },
  },
];
