import {
  collection,
  doc,
  getDoc,
  setDoc,
  writeBatch,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDb } from "./firebase";
import { DEFAULT_CATEGORIES } from "./categories";
import type { UserProfile } from "./types";

export type CollectionName =
  | "categories"
  | "people"
  | "groups"
  | "expenses"
  | "settlements"
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
 * Make sure a profile document exists for the signed-in user, and seed the
 * default categories on first login.
 */
export async function ensureUserProfile(
  user: User,
  db: Firestore = getDb()
): Promise<UserProfile> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    const updated: UserProfile = {
      ...existing,
      uid: user.uid,
      email: user.email ?? existing.email ?? null,
      updatedAt: Date.now(),
    };
    await setDoc(ref, updated, { merge: true });
    return updated;
  }

  const now = Date.now();
  const profile: UserProfile = {
    uid: user.uid,
    name: user.displayName ?? user.email?.split("@")[0] ?? "You",
    email: user.email ?? null,
    currency: "PKR",
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(ref, profile);
  for (const category of DEFAULT_CATEGORIES) {
    const categoryRef = doc(collection(db, "users", user.uid, "categories"));
    batch.set(categoryRef, { ...category, createdAt: now });
  }
  await batch.commit();

  return profile;
}
