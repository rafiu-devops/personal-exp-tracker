"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, writeBatch } from "firebase/firestore";
import { getDb, getFirebaseAuth, isFirebaseConfigured } from "./firebase";
import { DEFAULT_CATEGORIES } from "./categories";
import { DEFAULT_ACCOUNTS } from "./accounts";
import { stripUndefined } from "./firestore";
import { isOnline } from "./online";
import type { Account, Category, UserProfile } from "./types";

const OFFLINE_ACCOUNTS_KEY = "mm.offline_accounts";
const OFFLINE_SESSION_KEY = "mm.offline_session";
const PENDING_SYNC_KEY = "mm.pending_sync";
const OFFLINE_DATA_PREFIX = "mm.data.";

export interface OfflineAccount {
  uid: string;
  email: string;
  name: string;
  password: string;
  createdAt: number;
}

export interface PendingSync {
  type: "signup" | "login";
  email: string;
  name?: string;
  password: string;
  offlineUid: string;
  createdAt: number;
}

export interface OfflineSession {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  isOffline: true;
}

/* ---------------------------------------------------- Offline Accounts List */

export function getOfflineAccounts(): OfflineAccount[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as OfflineAccount[]) : [];
  } catch {
    return [];
  }
}

export function saveOfflineAccount(account: OfflineAccount): void {
  if (typeof localStorage === "undefined") return;
  try {
    const existing = getOfflineAccounts().filter(
      (a) => a.email.toLowerCase() !== account.email.toLowerCase()
    );
    existing.push(account);
    localStorage.setItem(OFFLINE_ACCOUNTS_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error("Failed to save offline account", err);
  }
}

export function findOfflineAccount(email: string): OfflineAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return getOfflineAccounts().find((a) => a.email.toLowerCase() === normalized);
}

/* --------------------------------------------------- Active Offline Session */

export function getOfflineSession(): OfflineSession | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(OFFLINE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as OfflineSession) : null;
  } catch {
    return null;
  }
}

export function setOfflineSession(session: OfflineSession | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (session) {
      localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(OFFLINE_SESSION_KEY);
    }
  } catch {
    // Ignore quota issues.
  }
}

export function clearOfflineSession(): void {
  setOfflineSession(null);
}

/* ------------------------------------------------------------- Pending Sync */

export function getPendingSync(): PendingSync | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    return raw ? (JSON.parse(raw) as PendingSync) : null;
  } catch {
    return null;
  }
}

export function setPendingSync(sync: PendingSync | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (sync) {
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(sync));
    } else {
      localStorage.removeItem(PENDING_SYNC_KEY);
    }
  } catch {
    // Ignore.
  }
}

/* ------------------------------------------------- Local Collections Storage */

export function getOfflineCollection<T>(uid: string, collectionName: string): T[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const key = `${OFFLINE_DATA_PREFIX}${uid}.${collectionName}`;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function setOfflineCollection<T>(uid: string, collectionName: string, items: T[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    const key = `${OFFLINE_DATA_PREFIX}${uid}.${collectionName}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save offline collection", collectionName, err);
  }
}

/**
 * Seed initial default categories and accounts for an offline user.
 */
export function seedOfflineUserData(uid: string): void {
  const existingCats = getOfflineCollection<Category>(uid, "categories");
  if (existingCats.length === 0) {
    const cats: Category[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
      ...cat,
      id: `cat_off_${Date.now()}_${idx}`,
      createdAt: Date.now(),
    }));
    setOfflineCollection(uid, "categories", cats);
  }

  const existingAccounts = getOfflineCollection<Account>(uid, "accounts");
  if (existingAccounts.length === 0) {
    const accs: Account[] = DEFAULT_ACCOUNTS.map((acc, idx) => ({
      ...acc,
      id: `acc_off_${Date.now()}_${idx}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    setOfflineCollection(uid, "accounts", accs);
  }
}

export function clearOfflineUserData(uid: string): void {
  if (typeof localStorage === "undefined") return;
  const collections = [
    "categories",
    "accounts",
    "expenses",
    "settlements",
    "incomes",
    "transfers",
    "groups",
    "people",
  ];
  for (const c of collections) {
    try {
      localStorage.removeItem(`${OFFLINE_DATA_PREFIX}${uid}.${c}`);
    } catch {
      // Ignore.
    }
  }
}

/* -------------------------------------------------------------- Auto Sync */

let isSyncing = false;

/**
 * Checks for any pending signup or login queued while offline and automatically
 * pushes it to Firebase Auth and Firestore once connected.
 */
export async function syncPendingOfflineAccount(
  onSuccess?: (message: string) => void
): Promise<boolean> {
  if (isSyncing || !isOnline() || !isFirebaseConfigured()) return false;
  const pending = getPendingSync();
  if (!pending) return false;

  isSyncing = true;
  try {
    const auth = getFirebaseAuth();
    const db = getDb();
    let firebaseUser;

    if (pending.type === "signup") {
      try {
        const cred = await createUserWithEmailAndPassword(auth, pending.email, pending.password);
        firebaseUser = cred.user;
        if (pending.name) {
          await updateProfile(firebaseUser, { displayName: pending.name });
        }
      } catch (err: unknown) {
        const code =
          typeof err === "object" && err !== null && "code" in err
            ? String((err as { code: unknown }).code)
            : "";
        // If account was already created online previously, sign in instead!
        if (code === "auth/email-already-in-use") {
          const cred = await signInWithEmailAndPassword(auth, pending.email, pending.password);
          firebaseUser = cred.user;
        } else {
          console.warn("Offline sync deferred: auth error", err);
          return false;
        }
      }
    } else {
      // Pending login
      try {
        const cred = await signInWithEmailAndPassword(auth, pending.email, pending.password);
        firebaseUser = cred.user;
      } catch (err) {
        console.warn("Offline sync deferred: login error", err);
        return false;
      }
    }

    if (!firebaseUser) return false;

    // Migrate all offline data to the new online Firestore user doc
    const newUid = firebaseUser.uid;
    const oldUid = pending.offlineUid;

    const userRef = doc(db, "users", newUid);
    const now = Date.now();
    const profileData: UserProfile = {
      uid: newUid,
      name: firebaseUser.displayName ?? pending.name ?? pending.email.split("@")[0] ?? "You",
      email: firebaseUser.email ?? pending.email,
      currency: "PKR",
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userRef, stripUndefined(profileData), { merge: true });

    // Migrate subcollections
    const collectionsToMigrate = [
      "categories",
      "accounts",
      "expenses",
      "settlements",
      "incomes",
      "transfers",
      "groups",
      "people",
    ];

    for (const collName of collectionsToMigrate) {
      const offlineItems = getOfflineCollection<Record<string, unknown>>(oldUid, collName);
      if (offlineItems.length > 0) {
        const batch = writeBatch(db);
        for (const item of offlineItems) {
          const id = (item.id as string) || doc(db, "temp").id;
          const docRef = doc(db, "users", newUid, collName, id);
          batch.set(docRef, stripUndefined(item), { merge: true });
        }
        await batch.commit();
      }
    }

    // Clean up offline queue
    setPendingSync(null);
    clearOfflineSession();
    clearOfflineUserData(oldUid);

    onSuccess?.("Online now! Your offline account and data have been synced to the cloud.");
    return true;
  } catch (error) {
    console.error("Error syncing offline data", error);
    return false;
  } finally {
    isSyncing = false;
  }
}
