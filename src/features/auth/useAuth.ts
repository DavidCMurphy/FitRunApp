import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import {
  getGetAuthMeQueryOptions,
  usePostAuthLogin,
  usePostAuthRegister
} from '../../api/generated/fitRunBackend';
import type { AuthResponse, ErrorResponse } from '../../api/generated/model';
import { getCurrentSession, setCurrentSession, subscribeToSession } from './sessionManager';
import { clearSession, loadSession, saveSession } from './tokenStorage';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

type ApiError = Error & {
  info?: ErrorResponse;
  response?: {
    data?: ErrorResponse;
  };
};

const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const;

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'info' in error) {
    const info = (error as ApiError).info;
    if (info?.error) {
      return info.error;
    }
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as ApiError).response;
    if (response?.data?.error) {
      return response.data.error;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function requireAuthResponse(response: AuthResponse | ErrorResponse, fallback: string) {
  if ('accessToken' in response) {
    return response;
  }

  if ('error' in response) {
    throw new Error(response.error);
  }

  throw new Error(fallback);
}

async function restoreAuthSession(queryClient: QueryClient) {
  const storedSession = await loadSession();

  if (!storedSession) {
    setCurrentSession(null);
    return null;
  }

  try {
    setCurrentSession(storedSession, { notify: false });
    await queryClient.fetchQuery(getGetAuthMeQueryOptions());
    setCurrentSession(getCurrentSession() ?? storedSession);
    return getCurrentSession() ?? storedSession;
  } catch {
    await clearSession();
    setCurrentSession(null);
    return null;
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const loginMutation = usePostAuthLogin();
  const registerMutation = usePostAuthRegister();
  const [error, setError] = useState<string | null>(null);
  const sessionQuery = useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: () => restoreAuthSession(queryClient),
    staleTime: Infinity
  });
  const session = sessionQuery.data ?? null;
  const status: AuthStatus = sessionQuery.isPending ? 'checking' : session ? 'authenticated' : 'unauthenticated';
  const isSubmitting = loginMutation.isPending || registerMutation.isPending;

  useEffect(() => {
    return subscribeToSession((nextSession) => {
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, nextSession);
    });
  }, [queryClient]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null);

      try {
      const loginResponse = await loginMutation.mutateAsync({ data: { email, password } });
      const nextSession = requireAuthResponse(loginResponse, 'Unable to sign in');
      setCurrentSession(nextSession, { notify: false });
      await queryClient.fetchQuery(getGetAuthMeQueryOptions());
      await saveSession(getCurrentSession() ?? nextSession);
      setCurrentSession(getCurrentSession() ?? nextSession);
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, getCurrentSession() ?? nextSession);
      } catch (signInError) {
        await clearSession();
        setCurrentSession(null);
        queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null);
        setError(getRequestErrorMessage(signInError, 'Unable to sign in'));
      }
    },
    [loginMutation, queryClient]
  );

  const signUp = useCallback(
    async (email: string, displayName: string, password: string) => {
      setError(null);

      try {
        const registerResponse = await registerMutation.mutateAsync({
          data: { email, displayName, password }
        });
      const nextSession = requireAuthResponse(registerResponse, 'Unable to create account');
      setCurrentSession(nextSession, { notify: false });
      await queryClient.fetchQuery(getGetAuthMeQueryOptions());
      await saveSession(getCurrentSession() ?? nextSession);
      setCurrentSession(getCurrentSession() ?? nextSession);
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, getCurrentSession() ?? nextSession);
      } catch (signUpError) {
        await clearSession();
        setCurrentSession(null);
        queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null);
        setError(getRequestErrorMessage(signUpError, 'Unable to create account'));
      }
    },
    [queryClient, registerMutation]
  );

  const signOut = useCallback(async () => {
    await clearSession();
    setCurrentSession(null);
    queryClient.clear();
    queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null);
  }, [queryClient]);

  return useMemo(
    () => ({
      error,
      isSubmitting,
      session,
      signIn,
      signOut,
      signUp,
      status
    }),
    [error, isSubmitting, session, signIn, signOut, signUp, status]
  );
}
