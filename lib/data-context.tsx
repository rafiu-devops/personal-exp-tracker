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
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "./auth-context";
import { getDb, isFirebaseConfigured } from "./firebase";
import { stripUndefined, userCollection, withId } from "./firestore";
import { isOnline } from "./online";
import { accountTypeMeta } from "./accounts";
import { computeShares } from "./split";
import { SELF_ID } from "./types";
import { getOfflineCollection, setOfflineCollection } from "./offline-storage";
import type {
  Account,
  Category,
  Expense,
  ExpenseSplit,
  Group,
  Income,
  Person,
  Settlement,
  Transfer,
} from "./types";
import type {
  AccountValues,
  CategoryValues,
  ExpenseFormValues,
  GroupValues,
  IncomeValues,
  PersonValues,
  SettlementValues,
  TransferValues,
} from "./validation";

interface DataContextValue {
  categories: Category[];
  people: Person[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  accounts: Account[];
  incomes: Income[];
  transfers: Transfer[];
  loading: boolean;
  error: string | null;
  resolveName: (personId: string) => string;
  resolveCategory: (categoryId: string) => Category | undefined;
  resolvePerson: (personId: string) => Person | undefined;
  resolveAccount: (accountId: string) => Account | undefined;
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
  addAccount: (values: AccountValues) => Promise<string>;
  updateAccount: (id: string, values: Partial<AccountValues>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addIncome: (values: IncomeValues) => Promise<string>;
  deleteIncome: (id: string) => Promise<void>;
  addTransfer: (values: TransferValues) => Promise<string>;
  deleteTransfer: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function cleanOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Firestore resolves write promises only once the backend acknowledges them,
 * which never happens while offline. The write is still applied to the local
 * cache immediately, so when offline we kick it off and resolve right away
 * instead of hanging the UI.
 */
function runWrite(write: Promise<unknown>): Promise<void> {
  if (isOnline()) return write.then(() => undefined);
  write.catch((error) => console.error("Offline write queued for retry:", error));
  return Promise.resolve();
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
    accountId: cleanOptional(values.accountId),
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) {
      setCategories([]);
      setPeople([]);
      setGroups([]);
      setExpenses([]);
      setSettlements([]);
      setAccounts([]);
      setIncomes([]);
      setTransfers([]);
      return;
    }

    // Always immediately hydrate from local cache so the screen is interactive in 0ms!
    const cachedCats = getOfflineCollection<Category>(uid, "categories");
    if (cachedCats.length > 0) setCategories(cachedCats);
    const cachedPeople = getOfflineCollection<Person>(uid, "people");
    if (cachedPeople.length > 0) setPeople(cachedPeople);
    const cachedGroups = getOfflineCollection<Group>(uid, "groups");
    if (cachedGroups.length > 0) setGroups(cachedGroups);
    const cachedExpenses = getOfflineCollection<Expense>(uid, "expenses");
    if (cachedExpenses.length > 0) setExpenses(cachedExpenses);
    const cachedSettlements = getOfflineCollection<Settlement>(uid, "settlements");
    if (cachedSettlements.length > 0) setSettlements(cachedSettlements);
    const cachedAccounts = getOfflineCollection<Account>(uid, "accounts");
    if (cachedAccounts.length > 0) setAccounts(cachedAccounts);
    const cachedIncomes = getOfflineCollection<Income>(uid, "incomes");
    if (cachedIncomes.length > 0) setIncomes(cachedIncomes);
    const cachedTransfers = getOfflineCollection<Transfer>(uid, "transfers");
    if (cachedTransfers.length > 0) setTransfers(cachedTransfers);

    // If this is an offline user session or Firebase is not configured, we rely on local storage!
    if (uid.startsWith("offline_") || !isFirebaseConfigured()) {
      setPending(0);
      return;
    }

    setPending(8);
    const handleError = (err: unknown) => {
      console.error(err);
      // Fallback to local collections on offline/network errors
      setCategories(getOfflineCollection<Category>(uid, "categories"));
      setPeople(getOfflineCollection<Person>(uid, "people"));
      setGroups(getOfflineCollection<Group>(uid, "groups"));
      setExpenses(getOfflineCollection<Expense>(uid, "expenses"));
      setSettlements(getOfflineCollection<Settlement>(uid, "settlements"));
      setAccounts(getOfflineCollection<Account>(uid, "accounts"));
      setIncomes(getOfflineCollection<Income>(uid, "incomes"));
      setTransfers(getOfflineCollection<Transfer>(uid, "transfers"));
      setError("Could not load your data. Check your connection.");
      setPending((p) => Math.max(0, p - 1));
    };
    const done = () => setPending((p) => Math.max(0, p - 1));

    const subs = [
      onSnapshot(
        userCollection(uid, "categories"),
        (snap) => {
          const list = snap.docs.map((d) => withId<Category>(d));
          setCategories(list);
          setOfflineCollection(uid, "categories", list);
          done();
        },
        handleError
      ),
      onSnapshot(
        userCollection(uid, "people"),
        (snap) => {
          const list = snap.docs.map((d) => withId<Person>(d));
          setPeople(list);
          setOfflineCollection(uid, "people", list);
          done();
        },
        handleError
      ),
      onSnapshot(
        userCollection(uid, "groups"),
        (snap) => {
          const list = snap.docs.map((d) => withId<Group>(d));
          setGroups(list);
          setOfflineCollection(uid, "groups", list);
          done();
        },
        handleError
      ),
      onSnapshot(
        userCollection(uid, "expenses"),
        (snap) => {
          const list = snap.docs.map((d) => withId<Expense>(d));
          setExpenses(list);
          setOfflineCollection(uid, "expenses", list);
          done();
        },
        handleError
      ),
      onSnapshot(
        userCollection(uid, "settlements"),
        (snap) => {
          const list = snap.docs.map((d) => withId<Settlement>(d));
          setSettlements(list);
          setOfflineCollection(uid, "settlements", list);
          done();
        },
        handleError
      ),
      onSnapshot(
        userCollection(uid, "accounts"),
        (snap) => {
          const list = snap.docs.map((d) => withId<Account>(d));
          setAccounts(list);
          setOfflineCollection(uid, "accounts", list);
          done();
        },
        handleError
      ),
      onSnapshot(
        userCollection(uid, "incomes"),
        (snap) => {
          const list = snap.docs.map((d) => withId<Income>(d));
          setIncomes(list);
          setOfflineCollection(uid, "incomes", list);
          done();
        },
        handleError
      ),
      onSnapshot(
        userCollection(uid, "transfers"),
        (snap) => {
          const list = snap.docs.map((d) => withId<Transfer>(d));
          setTransfers(list);
          setOfflineCollection(uid, "transfers", list);
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

  const resolveAccount = useCallback(
    (accountId: string) => accounts.find((a) => a.id === accountId),
    [accounts]
  );

  const requireUid = () => {
    if (!uid) throw new Error("You must be signed in");
    return uid;
  };

  const addCategory = useCallback(async (values: CategoryValues) => {
    const u = requireUid();
    const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const category: Category = { ...values, id, isDefault: false, createdAt: Date.now() };

    setCategories((prev) => {
      const next = [...prev, category];
      setOfflineCollection(u, "categories", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      const ref = doc(userCollection(u, "categories"), id);
      void runWrite(
        setDoc(ref, stripUndefined({ ...values, isDefault: false, createdAt: category.createdAt }))
      );
    }
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const updateCategory = useCallback(async (id: string, values: Partial<CategoryValues>) => {
    const u = requireUid();
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...values } : c));
      setOfflineCollection(u, "categories", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(updateDoc(doc(getDb(), "users", u, "categories", id), stripUndefined(values)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deleteCategory = useCallback(async (id: string) => {
    const u = requireUid();
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setOfflineCollection(u, "categories", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(deleteDoc(doc(getDb(), "users", u, "categories", id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const addPerson = useCallback(async (values: PersonValues) => {
    const u = requireUid();
    const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const person: Person = {
      id,
      name: values.name.trim(),
      phone: cleanOptional(values.phone),
      email: cleanOptional(values.email),
      createdAt: Date.now(),
    };

    setPeople((prev) => {
      const next = [...prev, person];
      setOfflineCollection(u, "people", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      const ref = doc(userCollection(u, "people"), id);
      void runWrite(setDoc(ref, stripUndefined(person)));
    }
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const updatePerson = useCallback(async (id: string, values: Partial<PersonValues>) => {
    const u = requireUid();
    setPeople((prev) => {
      const next = prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...values,
              name: values.name?.trim() ?? p.name,
              phone: cleanOptional(values.phone) ?? p.phone,
              email: cleanOptional(values.email) ?? p.email,
            }
          : p
      );
      setOfflineCollection(u, "people", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(
        updateDoc(
          doc(getDb(), "users", u, "people", id),
          stripUndefined({
            ...values,
            name: values.name?.trim(),
            phone: cleanOptional(values.phone),
            email: cleanOptional(values.email),
          })
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deletePerson = useCallback(async (id: string) => {
    const u = requireUid();
    setPeople((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setOfflineCollection(u, "people", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(deleteDoc(doc(getDb(), "users", u, "people", id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const addGroup = useCallback(async (values: GroupValues) => {
    const u = requireUid();
    const now = Date.now();
    const id = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const group: Group = {
      id,
      name: values.name.trim(),
      description: cleanOptional(values.description),
      memberIds: values.memberIds ?? [],
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    setGroups((prev) => {
      const next = [...prev, group];
      setOfflineCollection(u, "groups", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      const ref = doc(userCollection(u, "groups"), id);
      void runWrite(setDoc(ref, stripUndefined(group)));
    }
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const updateGroup = useCallback(async (id: string, values: Partial<GroupValues>) => {
    const u = requireUid();
    setGroups((prev) => {
      const next = prev.map((g) =>
        g.id === id
          ? {
              ...g,
              ...values,
              name: values.name?.trim() ?? g.name,
              description: cleanOptional(values.description) ?? g.description,
              updatedAt: Date.now(),
            }
          : g
      );
      setOfflineCollection(u, "groups", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(
        updateDoc(
          doc(getDb(), "users", u, "groups", id),
          stripUndefined({
            ...values,
            name: values.name?.trim(),
            description: cleanOptional(values.description),
            updatedAt: Date.now(),
          })
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deleteGroup = useCallback(async (id: string) => {
    const u = requireUid();
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      setOfflineCollection(u, "groups", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(deleteDoc(doc(getDb(), "users", u, "groups", id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const addExpense = useCallback(async (values: ExpenseFormValues) => {
    const u = requireUid();
    const payload = buildExpense(values);
    const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const expense: Expense = { ...payload, id, createdAt: Date.now() };

    setExpenses((prev) => {
      const next = [expense, ...prev];
      setOfflineCollection(u, "expenses", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      const ref = doc(userCollection(u, "expenses"), id);
      void runWrite(setDoc(ref, stripUndefined({ ...payload, createdAt: expense.createdAt })));
    }
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const updateExpense = useCallback(async (id: string, values: ExpenseFormValues) => {
    const u = requireUid();
    const payload = buildExpense(values);
    setExpenses((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...payload } : e));
      setOfflineCollection(u, "expenses", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(
        setDoc(doc(getDb(), "users", u, "expenses", id), stripUndefined(payload), {
          merge: true,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deleteExpense = useCallback(async (id: string) => {
    const u = requireUid();
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      setOfflineCollection(u, "expenses", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(deleteDoc(doc(getDb(), "users", u, "expenses", id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const addSettlement = useCallback(async (values: SettlementValues) => {
    const u = requireUid();
    const id = `stl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const settlement: Settlement = {
      id,
      fromPersonId: values.fromPersonId,
      toPersonId: values.toPersonId,
      amount: Math.round(values.amount),
      date: values.date,
      note: cleanOptional(values.note),
      accountId: cleanOptional(values.accountId),
      groupId: cleanOptional(values.groupId),
      createdAt: Date.now(),
    };

    setSettlements((prev) => {
      const next = [settlement, ...prev];
      setOfflineCollection(u, "settlements", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      const ref = doc(userCollection(u, "settlements"), id);
      void runWrite(setDoc(ref, stripUndefined(settlement)));
    }
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deleteSettlement = useCallback(async (id: string) => {
    const u = requireUid();
    setSettlements((prev) => {
      const next = prev.filter((s) => s.id !== id);
      setOfflineCollection(u, "settlements", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(deleteDoc(doc(getDb(), "users", u, "settlements", id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const addAccount = useCallback(async (values: AccountValues) => {
    const u = requireUid();
    const now = Date.now();
    const id = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const meta = accountTypeMeta(values.type);
    const account: Account = {
      id,
      name: values.name.trim(),
      type: values.type,
      openingBalance: Math.round(values.openingBalance ?? 0),
      icon: values.icon ?? meta.icon,
      color: values.color ?? meta.color,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    setAccounts((prev) => {
      const next = [...prev, account];
      setOfflineCollection(u, "accounts", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      const ref = doc(userCollection(u, "accounts"), id);
      void runWrite(setDoc(ref, stripUndefined(account)));
    }
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const updateAccountRecord = useCallback(async (id: string, values: Partial<AccountValues>) => {
    const u = requireUid();
    setAccounts((prev) => {
      const next = prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...values,
              name: values.name?.trim() ?? a.name,
              openingBalance:
                values.openingBalance === undefined
                  ? a.openingBalance
                  : Math.round(values.openingBalance),
              updatedAt: Date.now(),
            }
          : a
      );
      setOfflineCollection(u, "accounts", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(
        updateDoc(
          doc(getDb(), "users", u, "accounts", id),
          stripUndefined({
            ...values,
            name: values.name?.trim(),
            openingBalance:
              values.openingBalance === undefined ? undefined : Math.round(values.openingBalance),
            updatedAt: Date.now(),
          })
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deleteAccount = useCallback(async (id: string) => {
    const u = requireUid();
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setOfflineCollection(u, "accounts", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(deleteDoc(doc(getDb(), "users", u, "accounts", id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const addIncome = useCallback(async (values: IncomeValues) => {
    const u = requireUid();
    const id = `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const income: Income = {
      id,
      accountId: values.accountId,
      amount: Math.round(values.amount),
      date: values.date,
      note: cleanOptional(values.note),
      createdAt: Date.now(),
    };

    setIncomes((prev) => {
      const next = [income, ...prev];
      setOfflineCollection(u, "incomes", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      const ref = doc(userCollection(u, "incomes"), id);
      void runWrite(setDoc(ref, stripUndefined(income)));
    }
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deleteIncome = useCallback(async (id: string) => {
    const u = requireUid();
    setIncomes((prev) => {
      const next = prev.filter((i) => i.id !== id);
      setOfflineCollection(u, "incomes", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(deleteDoc(doc(getDb(), "users", u, "incomes", id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const addTransfer = useCallback(async (values: TransferValues) => {
    const u = requireUid();
    const id = `trn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const transfer: Transfer = {
      id,
      fromAccountId: values.fromAccountId,
      toAccountId: values.toAccountId,
      amount: Math.round(values.amount),
      date: values.date,
      note: cleanOptional(values.note),
      createdAt: Date.now(),
    };

    setTransfers((prev) => {
      const next = [transfer, ...prev];
      setOfflineCollection(u, "transfers", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      const ref = doc(userCollection(u, "transfers"), id);
      void runWrite(setDoc(ref, stripUndefined(transfer)));
    }
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const deleteTransfer = useCallback(async (id: string) => {
    const u = requireUid();
    setTransfers((prev) => {
      const next = prev.filter((t) => t.id !== id);
      setOfflineCollection(u, "transfers", next);
      return next;
    });

    if (!u.startsWith("offline_")) {
      void runWrite(deleteDoc(doc(getDb(), "users", u, "transfers", id)));
    }
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
      accounts: [...accounts].sort((a, b) => a.createdAt - b.createdAt),
      incomes: [...incomes].sort((a, b) => b.createdAt - a.createdAt),
      transfers: [...transfers].sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt
      ),
      loading: authLoading || (Boolean(uid) && pending > 0),
      error,
      resolveName,
      resolveCategory,
      resolvePerson,
      resolveAccount,
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
      addAccount,
      updateAccount: updateAccountRecord,
      deleteAccount,
      addIncome,
      deleteIncome,
      addTransfer,
      deleteTransfer,
    }),
    [
      categories,
      people,
      groups,
      expenses,
      settlements,
      accounts,
      incomes,
      transfers,
      authLoading,
      uid,
      pending,
      error,
      resolveName,
      resolveCategory,
      resolvePerson,
      resolveAccount,
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
      addAccount,
      updateAccountRecord,
      deleteAccount,
      addIncome,
      deleteIncome,
      addTransfer,
      deleteTransfer,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
