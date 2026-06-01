import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

import { API_URL } from '../config/env';
import { clearSession, loadSession, saveSession } from '../features/auth/tokenStorage';
import { getCurrentSession, setCurrentSession } from '../features/auth/sessionManager';
import type { AuthSession } from '../features/auth/types';

const REFRESH_WINDOW_SECONDS = 60;

let refreshPromise: Promise<AuthSession | null> | null = null;
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export const apiAxios = axios.create({
  baseURL: API_URL
});

const refreshAxios = axios.create({
  baseURL: API_URL
});

function decodeBase64Url(value: string) {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  let output = '';
  let buffer = 0;
  let bits = 0;

  for (const character of normalizedValue) {
    if (character === '=') {
      break;
    }

    const index = BASE64_ALPHABET.indexOf(character);

    if (index === -1) {
      return null;
    }

    buffer = (buffer << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  try {
    return decodeURIComponent(
      output
        .split('')
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
  } catch {
    return output;
  }
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split('.');

  if (!payload) {
    return null;
  }

  try {
    const decodedPayload = decodeBase64Url(payload);

    return decodedPayload ? (JSON.parse(decodedPayload) as { exp?: number }) : null;
  } catch {
    return null;
  }
}

function shouldRefreshAccessToken(session: AuthSession) {
  const payload = decodeJwtPayload(session.accessToken);

  if (!payload?.exp) {
    return false;
  }

  const secondsUntilExpiry = payload.exp - Math.floor(Date.now() / 1000);
  return secondsUntilExpiry <= REFRESH_WINDOW_SECONDS;
}

async function readSession() {
  const session = getCurrentSession() ?? (await loadSession());

  if (session) {
    setCurrentSession(session, { notify: false });
  }

  return session;
}

async function refreshSession(session: AuthSession) {
  if (!refreshPromise) {
    refreshPromise = refreshAxios
      .post<AuthSession>('/auth/refresh', {
        refreshToken: session.refreshToken
      })
      .then(async (response) => {
        await saveSession(response.data);
        setCurrentSession(response.data);
        return response.data;
      })
      .catch(async () => {
        await clearSession();
        setCurrentSession(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function setAuthorizationHeader(config: InternalAxiosRequestConfig, accessToken: string) {
  const headers = AxiosHeaders.from(config.headers ?? {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  config.headers = headers;
}

function isAuthEndpoint(url?: string) {
  return Boolean(url?.includes('/auth/login') || url?.includes('/auth/register') || url?.includes('/auth/refresh'));
}

apiAxios.interceptors.request.use(async (config) => {
  if (isAuthEndpoint(config.url)) {
    return config;
  }

  const session = await readSession();

  if (!session) {
    return config;
  }

  const nextSession = shouldRefreshAccessToken(session) ? await refreshSession(session) : session;

  if (nextSession) {
    setAuthorizationHeader(config, nextSession.accessToken);
  }

  return config;
});

apiAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await clearSession();
      setCurrentSession(null);
    }

    return Promise.reject(error);
  }
);
