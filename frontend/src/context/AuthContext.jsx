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
  fetchResidentProfilePhoto,
} from "../api.js";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const profile = user?.resident_profile ?? user?.residentProfile;
  const profilePhotoPath = profile?.profile_photo_path;
  const profilePhotoUrl = profilePhotoPath && profilePhoto?.path === profilePhotoPath
    ? profilePhoto.url
    : null;

  // Hydrate session from localStorage on mount.
  useEffect(() => {
    const session = readStoredSession();
    if (session) {
      setUser(session.user);
      setToken(session.token);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (user?.demo_mode || !token || !profilePhotoPath) return undefined;

    let active = true;
    let photoUrl = null;
    fetchResidentProfilePhoto(token)
      .then((url) => {
        photoUrl = url;
        if (active) setProfilePhoto({ path: profilePhotoPath, url });
        else URL.revokeObjectURL(url);
      })
      .catch(() => {});

    return () => {
      active = false;
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [profilePhotoPath, token, user?.demo_mode]);

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

  const updateUser = useCallback((updates) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const nextUser = { ...currentUser, ...updates };
      if (token) persistSession(token, nextUser);
      return nextUser;
    });
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      profilePhotoUrl,
      isAuthenticated: !!token && !!user,
      isReady,
      login,
      logout,
      updateUser,
    }),
    [user, token, profilePhotoUrl, isReady, login, logout, updateUser],
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
