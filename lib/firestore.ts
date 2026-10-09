import {
  collection,
  doc,
  getDoc,
  getDocFromCache,
  setDoc,
  writeBatch,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDb } from "./firebase";
import { DEFAULT_CATEGORIES } from "./categories";
import { DEFAULT_ACCOUNTS } from "./accounts";
import { isOnline } from "./online";
import type { UserProfile } from "./types";

export type CollectionName =
  | "categories"
  | "people"
  | "groups"
  | "expenses"
  | "settlements"
  | "accounts"
  | "incomes"
  | "transfers"
  | "budgets";

export function userCollection(uid: string, name: CollectionName) {
  return collection(getDb(), "users", uid, name);
}

export function userDoc(uid: string, name: CollectionName, id: string) {
  return doc(getDb(), "users", uid, name, id);
}

export function profileRef(uid: string) {
  return doc(getDb(), "users", uid);
}

/** Attach the document id to the data payload. */
export function withId<T>(snap: QueryDocumentSnapshot): T & { id: string } {
  return { ...(snap.data() as T), id: snap.id };
}

/**
 * Remove keys whose value is `undefined`. Firestore throws
 * "Unsupported field value: undefined" on writes that include them, so every
 * payload must be passed through this before being written.
 */
export function stripUndefined<T extends object>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as T;
}

/** Build a provisional profile straight from the auth user (no network). */
export function profileFromUser(user: User): UserProfile {
  const now = Date.now();
  return {
    uid: user.uid,
    name: user.displayName ?? user.email?.split("@")[0] ?? "You",
    email: user.email ?? null,
    photoURL: user.photoURL ?? undefined,
    currency: "PKR",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Make sure a profile document exists for the signed-in user, and seed the
 * default categories and accounts on first login.
 *
 * This is offline-first: when the device is offline we read from Firestore's
 * persistent cache (never issuing a network read that would hang) and never
 * await a write, so the app can boot from a saved session without a connection.
 */
export async function ensureUserProfile(
  user: User,
  db: Firestore = getDb()
): Promise<UserProfile> {
  const ref = doc(db, "users", user.uid);
  const online = isOnline();

  let snap;
  try {
    snap = online ? await getDoc(ref) : await getDocFromCache(ref);
  } catch {
    // Offline cache miss, or a network hiccup while online. Fall back to what
    // we can derive locally so the UI never blocks.
    return profileFromUser(user);
  }

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    const updated: UserProfile = {
      ...existing,
      uid: user.uid,
      email: user.email ?? existing.email ?? null,
      updatedAt: Date.now(),
    };
    if (online) {
      // Fire-and-forget: a slow network must never block rendering.
      void setDoc(ref, stripUndefined(updated), { merge: true }).catch(() => {});
    }
    return updated;
  }

  const profile = profileFromUser(user);
  if (online) {
    try {
      const batch = writeBatch(db);
      batch.set(ref, stripUndefined(profile));
      for (const category of DEFAULT_CATEGORIES) {
        const categoryRef = doc(collection(db, "users", user.uid, "categories"));
        batch.set(categoryRef, stripUndefined({ ...category, createdAt: profile.createdAt }));
      }
      for (const account of DEFAULT_ACCOUNTS) {
        const accountRef = doc(collection(db, "users", user.uid, "accounts"));
        batch.set(
          accountRef,
          stripUndefined({
            ...account,
            createdAt: profile.createdAt,
            updatedAt: profile.createdAt,
          })
        );
      }
      await batch.commit();
    } catch {
      // Ignore — the local cache still has the provisional profile and will
      // sync once a connection is available.
    }
  }

  return profile;
}
