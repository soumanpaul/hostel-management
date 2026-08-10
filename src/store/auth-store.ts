import { create } from 'zustand';

import type { GoogleSession } from '@/services/google-auth';
import { deleteSessionItem, getSessionItem, setSessionItem } from '@/services/session-storage';

const SESSION_KEY = 'rabgyals-hostel.google-session';

type AuthState = {
  session: GoogleSession | null;
  isHydrated: boolean;
  hydrateSession: () => Promise<void>;
  signInWithGoogle: (session: GoogleSession) => Promise<void>;
  signOut: () => Promise<void>;
  markBackupComplete: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isHydrated: false,
  hydrateSession: async () => {
    const serializedSession = await getSessionItem(SESSION_KEY);
    set({
      session: serializedSession ? (JSON.parse(serializedSession) as GoogleSession) : null,
      isHydrated: true,
    });
  },
  signInWithGoogle: async (session) => {
    await setSessionItem(SESSION_KEY, JSON.stringify(session));
    set({ session, isHydrated: true });
  },
  signOut: async () => {
    await deleteSessionItem(SESSION_KEY);
    set({ session: null, isHydrated: true });
  },
  markBackupComplete: async () => {
    const currentSession = get().session;
    if (!currentSession) {
      return;
    }

    const nextSession = {
      ...currentSession,
      lastBackupAt: new Date().toISOString(),
    };
    await setSessionItem(SESSION_KEY, JSON.stringify(nextSession));
    set({ session: nextSession });
  },
}));
