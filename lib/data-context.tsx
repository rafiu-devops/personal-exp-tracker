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
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "./auth-context";
import { getDb, isFirebaseConfigured } from "./firebase";
import { stripUndefined, userCollection, withId } from "./firestore";
import { computeShares } from "./split";
import { SELF_ID } from "./types";
import type {
  Category,
  Expense,
  ExpenseSplit,
  Group,
  Person,
  Settlement,
} from "./types";
import type {
  CategoryValues,
  ExpenseFormValues,
  GroupValues,
  PersonValues,
  SettlementValues,
} from "./validation";

interface DataContextValue {
  categories: Category[];
  people: Person[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  loading: boolean;
  error: string | null;
  resolveName: (personId: string) => string;
  resolveCategory: (categoryId: string) => Category | undefined;
  resolvePerson: (personId: string) => Person | undefined;
  addCategory: (values: CategoryValues) => Promise<string>;
  updateCategory: (id: string, values: Partial<CategoryValues>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addPerson: (values: PersonValues) => Promise<string>;
  updatePerson: (id: string, values: Partial<PersonValues>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  addGroup: (values: GroupValues) => Promise<string>;
  updateGroup: (id: string, values: Partial<GroupValues>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addExpense: (values: ExpenseFormValues) => Promise<string>;
  updateExpense: (id: string, values: ExpenseFormValues) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addSettlement: (values: SettlementValues) => Promise<string>;
  deleteSettlement: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function cleanOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Build the persisted expense payload (with computed splits) from form values. */
function buildExpense(values: ExpenseFormValues): Omit<Expense, "id" | "createdAt"> {
  const amount = Math.round(values.amount);
  const base = {
    kind: values.kind,
    groupId: cleanOptional(values.groupId),
    title: values.title.trim(),
    amount,
    categoryId: values.categoryId,
    date: values.date,
    note: cleanOptional(values.note),
    paymentMethod: values.paymentMethod,
    updatedAt: Date.now(),
  };

  if (values.kind === "personal") {
    const split: ExpenseSplit = {
      personId: SELF_ID,
      owedAmount: amount,
      paidAmount: amount,
      settledAmount: 0,
    };
    return {
      ...base,
      payerId: SELF_ID,
      participantIds: [SELF_ID],
      splitType: "equal",
      splits: [split],
      status: "active",
    };
  }

  const shares = computeShares(
    amount,
    values.splitType,
    values.participantIds,
    values.entries
  );
  const splits: ExpenseSplit[] = shares.map((share) => ({
    personId: share.personId,
    owedAmount: share.owedAmount,
    paidAmount: share.personId === values.payerId ? amount : 0,
    settledAmount: 0,
  }));

  return {
    ...base,
    payerId: values.payerId,
    participantIds: values.participantIds,
    splitType: values.splitType,
    splits,
    status: "active",
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const uid = user?.uid;

  useEffect(() => {
    if (!uid || !isFirebaseConfigured()) {
      setCategories([]);
      setPeople([]);
      setGroups([]);
      setExpenses([]);
      setSettlements([]);
      return;
    }

    setPending(5);
    const handleError = (err: unknown) => {
      console.error(err);
      setError("Could not load your data. Check your connection.");
      setPending((p) => Math.max(0, p - 1));
    };
    const done = () => setPending((p) => Math.max(0, p - 1));

    const subs = [
      onSnapshot(
        userCollection(uid, "categories"),
        (snap) => {
          setCategories(snap.docs.map((d) => withId<Category>(d)));
          done();
        },
        handleError
      ),
      onSnapshot(
        userCollection(uid, "people"),
        (snap) => {
          setPeople(snap.docs.map((d) => withId<Person>(d)));
          done();
        },
        handleError
      ),
      onSnapshot(
        userCollection(uid, "groups"),
        (snap) => {
          setGroups(snap.docs.map((d) => withId<Group>(d)));
          done();
        },
        handleError
      ),
      onSnapshot(
        userCollection(uid, "expenses"),
        (snap) => {
          setExpenses(snap.docs.map((d) => withId<Expense>(d)));
          done();
        },
        handleError
      ),
      onSnapshot(
        userCollection(uid, "settlements"),
        (snap) => {
          setSettlements(snap.docs.map((d) => withId<Settlement>(d)));
          done();
        },
        handleError
      ),
    ];

    return () => subs.forEach((unsub) => unsub());
  }, [uid]);

  const resolveName = useCallback(
    (personId: string) => {
      if (personId === SELF_ID) return profile?.name ?? "You";
      return people.find((p) => p.id === personId)?.name ?? "Unknown";
    },
    [people, profile]
  );

  const resolveCategory = useCallback(
    (categoryId: string) => categories.find((c) => c.id === categoryId),
    [categories]
  );

  const resolvePerson = useCallback(
    (personId: string) => people.find((p) => p.id === personId),
    [people]
  );

  const requireUid = () => {
    if (!uid) throw new Error("You must be signed in");
    return uid;
  };

  const addCategory = useCallback(async (values: CategoryValues) => {
    const u = requireUid();
    const ref = await addDoc(
      userCollection(u, "categories"),
      stripUndefined({ ...values, isDefault: false, createdAt: Date.now() })
    );
    return ref.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const updateCategory = useCallback(async (id: string, values: Partial<CategoryValues>) => {
    const u = requireUid();
    await updateDoc(doc(getDb(), "users", u, "categories", id), stripUndefined(values));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deleteCategory = useCallback(async (id: string) => {
    const u = requireUid();
    await deleteDoc(doc(getDb(), "users", u, "categories", id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const addPerson = useCallback(async (values: PersonValues) => {
    const u = requireUid();
    const ref = await addDoc(
      userCollection(u, "people"),
      stripUndefined({
        name: values.name.trim(),
        phone: cleanOptional(values.phone),
        email: cleanOptional(values.email),
        createdAt: Date.now(),
      })
    );
    return ref.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const updatePerson = useCallback(async (id: string, values: Partial<PersonValues>) => {
    const u = requireUid();
    await updateDoc(
      doc(getDb(), "users", u, "people", id),
      stripUndefined({
        ...values,
        name: values.name?.trim(),
        phone: cleanOptional(values.phone),
        email: cleanOptional(values.email),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deletePerson = useCallback(async (id: string) => {
    const u = requireUid();
    await deleteDoc(doc(getDb(), "users", u, "people", id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const addGroup = useCallback(async (values: GroupValues) => {
    const u = requireUid();
    const now = Date.now();
    const ref = await addDoc(
      userCollection(u, "groups"),
      stripUndefined({
        name: values.name.trim(),
        description: cleanOptional(values.description),
        memberIds: values.memberIds ?? [],
        archived: false,
        createdAt: now,
        updatedAt: now,
      })
    );
    return ref.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const updateGroup = useCallback(async (id: string, values: Partial<GroupValues>) => {
    const u = requireUid();
    await updateDoc(
      doc(getDb(), "users", u, "groups", id),
      stripUndefined({
        ...values,
        name: values.name?.trim(),
        description: cleanOptional(values.description),
        updatedAt: Date.now(),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deleteGroup = useCallback(async (id: string) => {
    const u = requireUid();
    await deleteDoc(doc(getDb(), "users", u, "groups", id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const addExpense = useCallback(async (values: ExpenseFormValues) => {
    const u = requireUid();
    const payload = buildExpense(values);
    const ref = await addDoc(
      userCollection(u, "expenses"),
      stripUndefined({ ...payload, createdAt: Date.now() })
    );
    return ref.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const updateExpense = useCallback(async (id: string, values: ExpenseFormValues) => {
    const u = requireUid();
    const payload = buildExpense(values);
    await setDoc(doc(getDb(), "users", u, "expenses", id), stripUndefined(payload), {
      merge: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deleteExpense = useCallback(async (id: string) => {
    const u = requireUid();
    await deleteDoc(doc(getDb(), "users", u, "expenses", id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const addSettlement = useCallback(async (values: SettlementValues) => {
    const u = requireUid();
    const ref = await addDoc(
      userCollection(u, "settlements"),
      stripUndefined({
        fromPersonId: values.fromPersonId,
        toPersonId: values.toPersonId,
        amount: Math.round(values.amount),
        date: values.date,
        note: cleanOptional(values.note),
        groupId: cleanOptional(values.groupId),
        createdAt: Date.now(),
      })
    );
    return ref.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deleteSettlement = useCallback(async (id: string) => {
    const u = requireUid();
    await deleteDoc(doc(getDb(), "users", u, "settlements", id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const value = useMemo<DataContextValue>(
    () => ({
      categories: [...categories].sort((a, b) => a.name.localeCompare(b.name)),
      people: [...people].sort((a, b) => a.name.localeCompare(b.name)),
      groups: [...groups].sort((a, b) => a.name.localeCompare(b.name)),
      expenses: [...expenses].sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt
      ),
      settlements: [...settlements].sort((a, b) => b.createdAt - a.createdAt),
      loading: authLoading || (Boolean(uid) && pending > 0),
      error,
      resolveName,
      resolveCategory,
      resolvePerson,
      addCategory,
      updateCategory,
      deleteCategory,
      addPerson,
      updatePerson,
      deletePerson,
      addGroup,
      updateGroup,
      deleteGroup,
      addExpense,
      updateExpense,
      deleteExpense,
      addSettlement,
      deleteSettlement,
    }),
    [
      categories,
      people,
      groups,
      expenses,
      settlements,
      authLoading,
      uid,
      pending,
      error,
      resolveName,
      resolveCategory,
      resolvePerson,
      addCategory,
      updateCategory,
      deleteCategory,
      addPerson,
      updatePerson,
      deletePerson,
      addGroup,
      updateGroup,
      deleteGroup,
      addExpense,
      updateExpense,
      deleteExpense,
      addSettlement,
      deleteSettlement,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
