import { createContext, useContext, useCallback } from 'react';
import { STORAGE_KEY } from '@/tutorials/config';

interface TutorialContextValue {
  resetAll: () => void;
  resetPage: (key: string) => void;
  isPageCompleted: (key: string) => boolean;
}

const TutorialContext = createContext<TutorialContextValue>({
  resetAll: () => {},
  resetPage: () => {},
  isPageCompleted: () => false,
});

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const resetPage = useCallback((key: string) => {
    try {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      delete store[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch { /* noop */ }
  }, []);

  const isPageCompleted = useCallback((key: string) => {
    try {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return store[key]?.completed ?? false;
    } catch { return false; }
  }, []);

  return (
    <TutorialContext.Provider value={{ resetAll, resetPage, isPageCompleted }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorialContext() {
  return useContext(TutorialContext);
}
