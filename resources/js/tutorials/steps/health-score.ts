import type { DriveStep } from 'driver.js';

export const healthScoreSteps: DriveStep[] = [
  {
    element: '[data-tutorial="hs-score"]',
    popover: {
      title: 'Score de Saúde',
      description: 'Sua nota financeira de 0 a 100. Calculada com base em 6 componentes do seu comportamento financeiro.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="hs-grade"]',
    popover: {
      title: 'Classificação',
      description: 'A+ a F — sua classificação geral. Mire no A+ com reserva de emergência, sem dívidas caras e investindo.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="hs-components"]',
    popover: {
      title: 'Componentes',
      description: 'Cada barra representa um aspecto financeiro. Passe o mouse para ver detalhes e como melhorar cada um.',
      side: 'top',
    },
  },
  {
    element: '[data-tutorial="hs-tip"]',
    popover: {
      title: 'Área para Melhorar',
      description: 'O componente com menor pontuação. Foque aqui primeiro para o maior impacto no seu score.',
      side: 'top',
    },
  },
];
