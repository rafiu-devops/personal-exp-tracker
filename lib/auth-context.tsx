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
import { ensureUserProfile, stripUndefined } from "./firestore";
import { friendlyError } from "./errors";
import type { UserProfile } from "./types";

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

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const p = await ensureUserProfile(nextUser);
          setProfile(p);
        } catch (error) {
          console.error("Failed to load profile", error);
        } finally {
          setLoadedProfile(true);
        }
      } else {
        setProfile(null);
        setLoadedProfile(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [configured]);

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
    await signOut(getFirebaseAuth());
  }, []);

  const refreshProfile = useCallback(async () => {
    const current = getFirebaseAuth().currentUser;
    if (!current) return;
    const p = await ensureUserProfile(current);
    setProfile(p);
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
