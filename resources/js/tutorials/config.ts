import type { DriveStep } from 'driver.js';

export interface TutorialConfig {
  key: string;
  title: string;
  steps: DriveStep[];
  autoStart?: boolean;
  autoStartDelay?: number;
}

export const STORAGE_KEY = 'fin-tutorials';
export const TUTORIAL_AUTO_START_DELAY = 800;
