import { useCallback, useEffect, useRef } from 'react';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import type { TutorialConfig } from '@/tutorials/config';
import { STORAGE_KEY, TUTORIAL_AUTO_START_DELAY } from '@/tutorials/config';

interface TutorialPageState {
  completed: boolean;
  completedAt: string | null;
  skippedAt: string | null;
  lastStepIndex: number;
}

type TutorialStore = Record<string, TutorialPageState>;

function getStore(): TutorialStore {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function defaultState(): TutorialPageState {
  return { completed: false, completedAt: null, skippedAt: null, lastStepIndex: 0 };
}

function setPageState(key: string, state: Partial<TutorialPageState>): void {
  const store = getStore();
  store[key] = { ...defaultState(), ...store[key], ...state };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function useTutorial(config: TutorialConfig | null) {
  const driverRef = useRef<Driver | null>(null);

  const isCompleted = useCallback((): boolean => {
    if (!config) return true;
    const store = getStore();
    return store[config.key]?.completed ?? false;
  }, [config]);

  const start = useCallback(() => {
    if (!config || config.steps.length === 0) return;

    const allExist = config.steps.every((step) => {
      if (!step.element) return true;
      return document.querySelector(step.element as string) !== null;
    });

    if (!allExist) return;

    driverRef.current = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      stagePadding: 8,
      stageRadius: 12,
      allowClose: true,
      overlayClickNext: false,
      popoverClass: 'fin-tutorial-popover',
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Próximo →',
      prevBtnText: '← Anterior',
      doneBtnText: '✓ Entendi!',
      steps: config.steps,
      onDestroyStarted: () => {
        const activeIndex = driverRef.current?.getActiveIndex() ?? 0;
        const isLast = activeIndex === config.steps.length - 1;
        if (isLast) {
          setPageState(config.key, { completed: true, completedAt: new Date().toISOString(), lastStepIndex: activeIndex });
        } else {
          setPageState(config.key, { skippedAt: new Date().toISOString(), lastStepIndex: activeIndex });
        }
        driverRef.current?.destroy();
      },
      onDestroyed: () => { driverRef.current = null; },
    });

    driverRef.current.drive();
  }, [config]);

  const reset = useCallback(() => {
    if (!config) return;
    setPageState(config.key, defaultState());
  }, [config]);

  useEffect(() => {
    if (!config || config.autoStart === false) return;
    if (isCompleted()) return;
    const store = getStore();
    if (store[config.key]?.skippedAt) return;

    const timeout = setTimeout(() => { start(); }, config.autoStartDelay ?? TUTORIAL_AUTO_START_DELAY);
    return () => clearTimeout(timeout);
  }, [config, start, isCompleted]);

  useEffect(() => {
    return () => { driverRef.current?.destroy(); };
  }, []);

  return { start, isCompleted, reset };
}
