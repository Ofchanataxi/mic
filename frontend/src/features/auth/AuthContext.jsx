import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../../api/authApi.js';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../../utils/storage.js';

export const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded));
  } catch (_) {
    return null;
  }
}

function isAccessTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now() + 30000;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const isAuthenticated = Boolean(getAccessToken());

  const loadCurrentUser = useCallback(async () => {
    const currentUser = await authApi.getCurrentUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!accessToken) {
        if (mounted) setBootstrapping(false);
        return;
      }

      try {
        if (isAccessTokenExpired(accessToken)) {
          if (!refreshToken) {
            clearTokens();
            if (mounted) setUser(null);
            return;
          }

          const refreshed = await authApi.refresh(refreshToken);
          setTokens(refreshed);
        }

        const currentUser = await authApi.getCurrentUser();
        if (mounted) setUser(currentUser);
      } catch (_) {
        clearTokens();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const result = await authApi.login({ email, password });
    setTokens(result);
    setUser(result.user || null);
    if (!result.user) await loadCurrentUser();
    return result;
  }, [loadCurrentUser]);

  const register = useCallback(async (payload) => {
    const result = await authApi.register(payload);
    if (result.accessToken) {
      setTokens(result);
      setUser(result.user || null);
      if (!result.user) await loadCurrentUser();
    }
    return result;
  }, [loadCurrentUser]);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch (_) {
      // Local logout should still clear stale credentials.
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    bootstrapping,
    isAuthenticated: Boolean(getAccessToken()),
    login,
    register,
    logout,
    refreshUser: loadCurrentUser,
  }), [user, bootstrapping, isAuthenticated, login, register, logout, loadCurrentUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
