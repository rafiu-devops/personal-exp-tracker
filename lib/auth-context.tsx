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
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
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

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loadedProfile: boolean;
  configured: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
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

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        // Show a cached profile instantly (works offline), then refresh it.
        const cached = readCachedProfile(nextUser.uid);
        if (cached) setProfile(cached);
        void loadProfile(nextUser);
      } else {
        setProfile(null);
        setLoadedProfile(false);
      }
      // Auth is resolved — let the UI render instead of waiting on Firestore.
      setLoading(false);
    });
    return () => unsubscribe();
  }, [configured, loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password
      );
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      await ensureUserProfile(cred.user);
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(getFirebaseAuth(), getGoogleAuthProvider());
  }, []);

  const signOutUser = useCallback(async () => {
    const current = getFirebaseAuth().currentUser;
    if (current) clearCachedProfile(current.uid);
    await signOut(getFirebaseAuth());
  }, []);

  const refreshProfile = useCallback(async () => {
    const current = getFirebaseAuth().currentUser;
    if (!current) return;
    const p = await ensureUserProfile(current);
    setProfile(p);
    writeCachedProfile(p);
  }, []);

  const updateAccount = useCallback(
    async (patch: Partial<Pick<UserProfile, "name" | "currency" | "photoURL">>) => {
      const current = getFirebaseAuth().currentUser;
      if (!current) throw new Error("Not signed in");
      const next: Record<string, unknown> = { ...patch, updatedAt: Date.now() };
      if (patch.photoURL === "") {
        // Allow clearing the avatar (removes the field on merge).
        next.photoURL = deleteField();
      }
      await setDoc(doc(getDb(), "users", current.uid), stripUndefined(next), {
        merge: true,
      });
      if (patch.name || patch.photoURL !== undefined) {
        await updateProfile(current, {
          ...(patch.name ? { displayName: patch.name } : {}),
          ...(patch.photoURL !== undefined ? { photoURL: patch.photoURL || null } : {}),
        });
      }
      setProfile((prev) =>
        prev ? { ...prev, ...patch, updatedAt: Date.now() } : prev
      );
    },
    []
  );

  // Persist the latest profile to the local cache whenever it changes so an
  // offline reload can show the right name/avatar immediately.
  useEffect(() => {
    if (profile) writeCachedProfile(profile);
  }, [profile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      loadedProfile,
      configured,
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
