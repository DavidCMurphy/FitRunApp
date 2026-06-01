import * as Keychain from 'react-native-keychain';

import type { AuthSession } from './types';

const AUTH_SERVICE = 'com.fitrunapp.mobile.auth';

export async function saveSession(session: AuthSession) {
  await Keychain.setGenericPassword(session.user.email, JSON.stringify(session), {
    service: AUTH_SERVICE
  });
}

export async function loadSession() {
  const credentials = await Keychain.getGenericPassword({ service: AUTH_SERVICE });

  if (!credentials) {
    return null;
  }

  try {
    return JSON.parse(credentials.password) as AuthSession;
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession() {
  await Keychain.resetGenericPassword({ service: AUTH_SERVICE });
}
