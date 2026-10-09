"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "mm.hideBalance";

interface BalanceVisibilityValue {
  /** Whether amounts are masked. Hidden by default for privacy. */
  hidden: boolean;
  toggle: () => void;
}

const BalanceVisibilityContext = createContext<BalanceVisibilityValue | null>(null);

export function BalanceVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(true);

  const toggle = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore storage failures.
      }
      return next;
    });
  }, []);

  return (
    <BalanceVisibilityContext.Provider value={{ hidden, toggle }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility(): BalanceVisibilityValue {
  const ctx = useContext(BalanceVisibilityContext);
  if (!ctx) throw new Error("useBalanceVisibility must be used inside <BalanceVisibilityProvider>");
  return ctx;
}
