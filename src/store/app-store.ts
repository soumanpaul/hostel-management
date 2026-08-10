import { create } from 'zustand';

import { initializeDatabase } from '@/db/database';
import { useAuthStore } from '@/store/auth-store';

type AppState = {
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
  initializeApp: () => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  isReady: false,
  isInitializing: false,
  error: null,
  initializeApp: async () => {
    if (get().isReady || get().isInitializing) {
      return;
    }

    set({ isInitializing: true, error: null });

    try {
      await initializeDatabase();
      await useAuthStore.getState().hydrateSession();
      set({ isReady: true, isInitializing: false });
    } catch (error) {
      set({
        isReady: false,
        isInitializing: false,
        error: error instanceof Error ? error.message : 'App initialization failed.',
      });
    }
  },
}));
