"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Avatar, IconButton } from "@/components/ui";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import {
  ChartIcon,
  GroupIcon,
  HomeIcon,
  LogoutIcon,
  ReceiptIcon,
  SettingsIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";

interface SidebarContextValue {
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const MENU = [
  { href: "/dashboard", label: "Dashboard", Icon: HomeIcon },
  { href: "/accounts", label: "Accounts", Icon: WalletIcon },
  { href: "/expenses", label: "Expenses", Icon: ReceiptIcon },
  { href: "/groups", label: "Groups", Icon: GroupIcon },
  { href: "/people", label: "People", Icon: UsersIcon },
  { href: "/reports", label: "Reports", Icon: ChartIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const value = useMemo<SidebarContextValue>(
    () => ({ open: () => setIsOpen(true), close: () => setIsOpen(false) }),
    []
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
      <Sidebar open={isOpen} onClose={() => setIsOpen(false)} />
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, signOutUser } = useAuth();
  const pathname = usePathname();
  const close = useCallback(() => onClose(), [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />
      <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-xl animate-fade-in">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <Avatar name={profile?.name ?? "You"} src={profile?.photoURL} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{profile?.name ?? "You"}</p>
            <p className="truncate text-xs text-foreground/55">{profile?.email}</p>
          </div>
          <IconButton label="Close menu" onClick={close}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </IconButton>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {MENU.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-foreground/70 hover:bg-surface-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-3">
          <div className="mb-2 flex items-center justify-between rounded-xl px-1 py-1">
            <span className="text-sm text-foreground/60">Theme</span>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => {
              close();
              void signOutUser();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-negative transition hover:bg-negative/10"
          >
            <LogoutIcon className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}
