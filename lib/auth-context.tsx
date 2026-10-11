"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { deleteField, doc, setDoc } from "firebase/firestore";
import { getDb, getFirebaseAuth, getGoogleAuthProvider, isFirebaseConfigured } from "./firebase";
import { ensureUserProfile, profileFromUser, stripUndefined } from "./firestore";
import { isOnline } from "./online";
import { friendlyError } from "./errors";
import type { UserProfile } from "./types";
import {
  clearOfflineSession,
  findOfflineAccount,
  getOfflineSession,
  saveOfflineAccount,
  seedOfflineUserData,
  setOfflineSession,
  setPendingSync,
  syncPendingOfflineAccount,
  type OfflineSession,
} from "./offline-storage";

const PROFILE_CACHE_PREFIX = "mm.profile.";

/** Locally cached profile so the app can render offline before Firestore loads. */
function readCachedProfile(uid: string): UserProfile | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_PREFIX + uid);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(profile: UserProfile) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PROFILE_CACHE_PREFIX + profile.uid, JSON.stringify(profile));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function clearCachedProfile(uid: string) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(PROFILE_CACHE_PREFIX + uid);
  } catch {
    // Ignore.
  }
}

export type AuthUser =
  | User
  | {
      uid: string;
      email: string | null;
      displayName: string | null;
      photoURL?: string | null;
      isOffline?: boolean;
    };

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loadedProfile: boolean;
  configured: boolean;
  isOfflineUser: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateAccount: (
    patch: Partial<Pick<UserProfile, "name" | "currency" | "photoURL">>
  ) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    return getOfflineSession();
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const session = getOfflineSession();
    return session ? readCachedProfile(session.uid) : null;
  });
  const [loading, setLoading] = useState(true);
  const [loadedProfile, setLoadedProfile] = useState(false);
  const configured = isFirebaseConfigured();

  // Loading a profile is best-effort and must never block the app shell, so it
  // runs independently of the auth state (and never awaits Firestore offline).
  const loadProfile = useCallback(async (nextUser: User) => {
    // Offline with a cached profile: keep showing it instead of letting a
    // network fallback overwrite it with a bare-bones profile.
    if (!isOnline() && readCachedProfile(nextUser.uid)) {
      setLoadedProfile(true);
      return;
    }
    try {
      const p = await ensureUserProfile(nextUser);
      setProfile(p);
      writeCachedProfile(p);
    } catch (error) {
      console.error("Failed to load profile", error);
      setProfile((prev) => prev ?? profileFromUser(nextUser));
    } finally {
      setLoadedProfile(true);
    }
  }, []);

  // Listen to connectivity changes to auto-sync pending offline registrations/logins
  useEffect(() => {
    const runSync = async () => {
      if (!isOnline()) return;
      await syncPendingOfflineAccount();
    };

    runSync();
    window.addEventListener("online", runSync);
    return () => window.removeEventListener("online", runSync);
  }, []);

  useEffect(() => {
    // If we have an active offline session, initialize immediately
    const existingOffline = getOfflineSession();
    if (existingOffline) {
      setUser(existingOffline);
      const cached = readCachedProfile(existingOffline.uid);
      if (cached) setProfile(cached);
      setLoadedProfile(true);
      setLoading(false);
    }

    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();

    // Check for result from redirect sign-in (fallback for mobile/popups)
    void getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          clearOfflineSession();
          void ensureUserProfile(result.user);
        }
      })
      .catch((err) => {
        console.error("Redirect sign-in error:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (nextUser) {
        clearOfflineSession();
        setUser(nextUser);
        const cached = readCachedProfile(nextUser.uid);
        if (cached) setProfile(cached);
        void loadProfile(nextUser);
      } else {
        // If not logged into Firebase, preserve offline session if one is active
        const offlineSession = getOfflineSession();
        if (offlineSession) {
          setUser(offlineSession);
          const cached = readCachedProfile(offlineSession.uid);
          if (cached) setProfile(cached);
        } else {
          setUser(null);
          setProfile(null);
          setLoadedProfile(false);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [configured, loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. If currently offline, log in locally via saved accounts or create an offline session
    if (!isOnline()) {
      const existing = findOfflineAccount(normalizedEmail);
      if (existing) {
        if (existing.password && existing.password !== password) {
          throw new Error("Incorrect password for saved offline account.");
        }
        const offlineSession: OfflineSession = {
          uid: existing.uid,
          email: existing.email,
          displayName: existing.name,
          photoURL: null,
          isOffline: true,
        };
        setOfflineSession(offlineSession);
        setUser(offlineSession);
        const cached = readCachedProfile(existing.uid);
        if (cached) {
          setProfile(cached);
        } else {
          const p: UserProfile = {
            uid: existing.uid,
            name: existing.name,
            email: existing.email,
            currency: "PKR",
            createdAt: existing.createdAt,
            updatedAt: Date.now(),
          };
          setProfile(p);
          writeCachedProfile(p);
        }
        setLoadedProfile(true);
        return;
      }

      // Offline login with previously unsaved credentials on this browser:
      // Create local account + queue sync when connection arrives
      const offlineUid = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const name = normalizedEmail.split("@")[0] || "You";
      saveOfflineAccount({
        uid: offlineUid,
        email: normalizedEmail,
        name,
        password,
        createdAt: Date.now(),
      });
      setPendingSync({
        type: "login",
        email: normalizedEmail,
        password,
        offlineUid,
        createdAt: Date.now(),
      });
      seedOfflineUserData(offlineUid);
      const offlineSession: OfflineSession = {
        uid: offlineUid,
        email: normalizedEmail,
        displayName: name,
        photoURL: null,
        isOffline: true,
      };
      setOfflineSession(offlineSession);
      setUser(offlineSession);
      const initialProfile: UserProfile = {
        uid: offlineUid,
        name,
        email: normalizedEmail,
        currency: "PKR",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setProfile(initialProfile);
      writeCachedProfile(initialProfile);
      setLoadedProfile(true);
      return;
    }

    // 2. Online: sign in with Firebase
    try {
      const cred = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        normalizedEmail,
        password
      );
      clearOfflineSession();
      // Cache credentials locally so user can log in when offline next time
      saveOfflineAccount({
        uid: cred.user.uid,
        email: normalizedEmail,
        name: cred.user.displayName || normalizedEmail.split("@")[0] || "You",
        password,
        createdAt: Date.now(),
      });
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : "";

      // Fallback if network drops during request
      if (code === "auth/network-request-failed" || !isOnline()) {
        const existing = findOfflineAccount(normalizedEmail);
        if (existing) {
          if (existing.password && existing.password !== password) {
            throw new Error("Incorrect password for saved offline account.");
          }
          const offlineSession: OfflineSession = {
            uid: existing.uid,
            email: existing.email,
            displayName: existing.name,
            photoURL: null,
            isOffline: true,
          };
          setOfflineSession(offlineSession);
          setUser(offlineSession);
          const cached = readCachedProfile(existing.uid);
          if (cached) setProfile(cached);
          setLoadedProfile(true);
          return;
        }
      }
      throw error;
    }
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim() || normalizedEmail.split("@")[0] || "You";

      const createOfflineUser = () => {
        const offlineUid = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        saveOfflineAccount({
          uid: offlineUid,
          email: normalizedEmail,
          name: trimmedName,
          password,
          createdAt: Date.now(),
        });
        setPendingSync({
          type: "signup",
          email: normalizedEmail,
          name: trimmedName,
          password,
          offlineUid,
          createdAt: Date.now(),
        });
        seedOfflineUserData(offlineUid);
        const offlineSession: OfflineSession = {
          uid: offlineUid,
          email: normalizedEmail,
          displayName: trimmedName,
          photoURL: null,
          isOffline: true,
        };
        setOfflineSession(offlineSession);
        setUser(offlineSession);
        const initialProfile: UserProfile = {
          uid: offlineUid,
          name: trimmedName,
          email: normalizedEmail,
          currency: "PKR",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setProfile(initialProfile);
        writeCachedProfile(initialProfile);
        setLoadedProfile(true);
      };

      if (!isOnline()) {
        createOfflineUser();
        return;
      }

      try {
        const cred = await createUserWithEmailAndPassword(
          getFirebaseAuth(),
          normalizedEmail,
          password
        );
        if (trimmedName) {
          await updateProfile(cred.user, { displayName: trimmedName });
        }
        await ensureUserProfile(cred.user);
        saveOfflineAccount({
          uid: cred.user.uid,
          email: normalizedEmail,
          name: trimmedName,
          password,
          createdAt: Date.now(),
        });
        clearOfflineSession();
      } catch (error: unknown) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? String((error as { code: unknown }).code)
            : "";
        if (code === "auth/network-request-failed" || !isOnline()) {
          createOfflineUser();
          return;
        }
        throw error;
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    if (!isOnline()) {
      throw new Error(
        "Continue with Google requires an active internet connection. Please connect to the internet or sign in with email."
      );
    }
    const auth = getFirebaseAuth();
    const provider = getGoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      clearOfflineSession();
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : "";
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw error;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    clearOfflineSession();
    const current = getFirebaseAuth().currentUser;
    if (current) clearCachedProfile(current.uid);
    try {
      await signOut(getFirebaseAuth());
    } catch {
      // Ignore if offline
    }
    setUser(null);
    setProfile(null);
    setLoadedProfile(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const current = getFirebaseAuth().currentUser;
    if (current) {
      const p = await ensureUserProfile(current);
      setProfile(p);
      writeCachedProfile(p);
    } else if (user) {
      const cached = readCachedProfile(user.uid);
      if (cached) setProfile(cached);
    }
  }, [user]);

  const updateAccount = useCallback(
    async (patch: Partial<Pick<UserProfile, "name" | "currency" | "photoURL">>) => {
      const uid = user?.uid;
      if (!uid) throw new Error("Not signed in");
      const next: Record<string, unknown> = { ...patch, updatedAt: Date.now() };
      if (patch.photoURL === "") {
        next.photoURL = deleteField();
      }

      if (isOnline() && !uid.startsWith("offline_")) {
        try {
          await setDoc(doc(getDb(), "users", uid), stripUndefined(next), { merge: true });
          const current = getFirebaseAuth().currentUser;
          if (current && (patch.name || patch.photoURL !== undefined)) {
            await updateProfile(current, {
              ...(patch.name ? { displayName: patch.name } : {}),
              ...(patch.photoURL !== undefined ? { photoURL: patch.photoURL || null } : {}),
            });
          }
        } catch (err) {
          console.warn("Online profile update failed, updating locally", err);
        }
      }

      setProfile((prev) => {
        const updated = prev ? { ...prev, ...patch, updatedAt: Date.now() } : prev;
        if (updated) writeCachedProfile(updated);
        return updated;
      });
    },
    [user]
  );

  useEffect(() => {
    if (profile) writeCachedProfile(profile);
  }, [profile]);

  const isOfflineUser = Boolean(user && (user.uid.startsWith("offline_") || ("isOffline" in user && user.isOffline)));

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      loadedProfile,
      configured,
      isOfflineUser,
      signIn,
      signUp,
      signInWithGoogle,
      signOutUser,
      updateAccount,
      refreshProfile,
    }),
    [
      user,
      profile,
      loading,
      loadedProfile,
      configured,
      isOfflineUser,
      signIn,
      signUp,
      signInWithGoogle,
      signOutUser,
      updateAccount,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export { friendlyError };
