import type { AuthSession } from './types';

type SessionListener = (session: AuthSession | null) => void;

let currentSession: AuthSession | null = null;
const listeners = new Set<SessionListener>();

export function getCurrentSession() {
  return currentSession;
}

type SetSessionOptions = {
  notify?: boolean;
};

export function setCurrentSession(session: AuthSession | null, options: SetSessionOptions = {}) {
  currentSession = session;

  if (options.notify === false) {
    return;
  }

  listeners.forEach((listener) => listener(session));
}

export function subscribeToSession(listener: SessionListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
