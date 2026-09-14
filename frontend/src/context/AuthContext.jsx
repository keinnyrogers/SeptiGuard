import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearSession,
  loginRequest,
  logoutRequest,
  persistSession,
  readStoredSession,
} from "../api.js";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Hydrate session from localStorage on mount.
  useEffect(() => {
    const session = readStoredSession();
    if (session) {
      setUser(session.user);
      setToken(session.token);
    }
    setIsReady(true);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token: newToken, user: newUser } = await loginRequest(email, password);
    persistSession(newToken, newUser);
    setUser(newUser);
    setToken(newToken);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await logoutRequest(token);
    }
    clearSession();
    setUser(null);
    setToken(null);
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isReady,
      login,
      logout,
    }),
    [user, token, isReady, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
