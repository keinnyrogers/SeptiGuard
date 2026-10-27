import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  clearSession,
  loginRequest,
  adminLoginRequest,
  logoutRequest,
  persistSession,
  readStoredSession,
  fetchResidentProfilePhoto,
} from "../api.js";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const { pathname } = useLocation();
  const portalRole = pathname.startsWith("/admin") ? "admin" : "resident";
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [readyRole, setReadyRole] = useState(null);
  const isReady = readyRole === portalRole;
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [logoutPromptOpen, setLogoutPromptOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const logoutResolver = useRef(null);
  const profile = user?.resident_profile ?? user?.residentProfile;
  const profilePhotoPath = profile?.profile_photo_path;
  const profilePhotoUrl = profilePhotoPath && profilePhoto?.path === profilePhotoPath
    ? profilePhoto.url
    : null;

  // Keep resident and admin sessions separate even when both portals share an origin.
  useEffect(() => {
    const session = readStoredSession(portalRole);
    if (session) {
      setUser(session.user);
      setToken(session.token);
    } else {
      setUser(null);
      setToken(null);
    }
    setReadyRole(portalRole);
  }, [portalRole]);

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

  useEffect(() => {
    if (
      user?.role !== "resident"
      || user?.demo_mode
      || !token
      || typeof Notification === "undefined"
      || Notification.permission !== "granted"
    ) {
      return undefined;
    }

    let active = true;
    let unsubscribe;
    import("../lib/firebase.js")
      .then(({ listenForFirebaseForegroundMessages }) => listenForFirebaseForegroundMessages())
      .then((cleanup) => {
        if (active) unsubscribe = cleanup;
        else cleanup();
      })
      .catch((error) => {
        console.error("Could not listen for foreground push notifications.", error);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [token, user?.demo_mode, user?.role]);

  const login = useCallback(async (email, password) => {
    const { token: newToken, user: newUser } = await loginRequest(email, password);
    persistSession(newToken, newUser);
    setUser(newUser);
    setToken(newToken);
    return newUser;
  }, []);

  const loginAdmin = useCallback(async (email, password) => {
    const { token: newToken, user: newUser } = await adminLoginRequest(email, password);
    persistSession(newToken, newUser);
    setUser(newUser);
    setToken(newToken);
    return newUser;
  }, []);

  const logout = useCallback(() => new Promise((resolve) => {
    logoutResolver.current?.(false);
    logoutResolver.current = resolve;
    setLogoutError("");
    setLogoutPromptOpen(true);
  }), []);

  const cancelLogout = useCallback(() => {
    if (logoutPending) return;
    setLogoutPromptOpen(false);
    setLogoutError("");
    logoutResolver.current?.(false);
    logoutResolver.current = null;
  }, [logoutPending]);

  const confirmLogout = useCallback(async () => {
    setLogoutPending(true);
    setLogoutError("");
    try {
      if (token) {
        await logoutRequest(token);
      }
      clearSession(user?.role);
      setUser(null);
      setToken(null);
      setLogoutPromptOpen(false);
      logoutResolver.current?.(true);
      logoutResolver.current = null;
    } catch (error) {
      setLogoutError(error.message || "Could not sign out. Please try again.");
    } finally {
      setLogoutPending(false);
    }
  }, [token, user]);

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
      user: isReady ? user : null,
      token: isReady ? token : null,
      profilePhotoUrl,
      isAuthenticated: isReady && !!token && !!user,
      isReady,
      login,
      loginAdmin,
      logout,
      updateUser,
    }),
    [user, token, profilePhotoUrl, isReady, login, loginAdmin, logout, updateUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AlertDialog
        open={logoutPromptOpen}
        onOpenChange={(open) => {
          if (!open) cancelLogout();
        }}
      >
        <AlertDialogContent className="max-w-sm border-border bg-card text-foreground">
          <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
              <LogOut className="h-5 w-5" />
            </span>
            <AlertDialogTitle className="font-display">Sign out of SeptiGuard?</AlertDialogTitle>
            <AlertDialogDescription>
              You’ll need to sign in again to access your resident or admin portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {logoutError && (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {logoutError}
            </p>
          )}
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              className="mt-0 w-full sm:w-auto"
              disabled={logoutPending}
              onClick={cancelLogout}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full gap-2 transition-all hover:bg-destructive hover:shadow-md hover:ring-2 hover:ring-destructive/40 sm:w-auto"
              disabled={logoutPending}
              onClick={confirmLogout}
            >
              <LogOut className="h-4 w-4" />
              {logoutPending ? "Signing out..." : "Sign out"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
