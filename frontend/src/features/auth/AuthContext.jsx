import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../../api/authApi.js';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../../utils/storage.js';

export const AuthContext = createContext(null);

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
      if (!getAccessToken()) {
        if (mounted) setBootstrapping(false);
        return;
      }

      try {
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
