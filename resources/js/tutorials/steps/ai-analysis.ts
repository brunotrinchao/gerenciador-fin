import type { DriveStep } from 'driver.js';

export const aiAnalysisSteps: DriveStep[] = [
  {
    element: '[data-tutorial="ai-controls"]',
    popover: {
      title: 'Análise por IA',
      description: 'Selecione o mês e clique em "Gerar Análise". O Google Gemini vai analisar seus dados financeiros.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="ai-month-select"]',
    popover: {
      title: 'Período',
      description: 'Escolha o mês e ano que deseja analisar. Funciona melhor para meses com bastante movimentação.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="ai-generate-btn"]',
    popover: {
      title: 'Gerar Análise',
      description: 'A IA analisa suas transações e retorna insights sobre gastos, padrões e recomendações personalizadas.',
      side: 'left',
    },
  },
];
