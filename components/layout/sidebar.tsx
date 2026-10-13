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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />
      <aside
        className={cn(
          "relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-surface shadow-2xl border-r border-border transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative flex items-start justify-between px-4 py-5 bg-gradient-to-br from-brand to-brand/90 text-white overflow-hidden">
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <Avatar name={profile?.name ?? "You"} src={profile?.photoURL} size={48} />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight">
                {profile?.name ?? "You"}
              </p>
              <p className="truncate text-xs text-white/70">{profile?.email}</p>
            </div>
          </div>
          <div className="relative flex items-center gap-1">
            <IconButton label="Close menu" onClick={close} className="text-white/90 hover:bg-white/15">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </IconButton>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {MENU.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "text-brand shadow-sm ring-1 ring-brand/20 bg-brand/10"
                    : "text-foreground/70 hover:text-foreground hover:bg-surface-muted"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition",
                    active
                      ? "bg-gradient-to-br from-brand to-brand/85 text-white shadow-md shadow-brand/30"
                      : "bg-surface-muted text-foreground/60 group-hover:bg-surface group-hover:text-brand"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="flex-1">{label}</span>
                {active && (
                  <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_0_4px_rgba(99,102,241,0.12)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-3">
          <button
            type="button"
            onClick={() => {
              close();
              void signOutUser();
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-negative transition hover:bg-negative/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-negative/10 text-negative">
              <LogoutIcon className="h-5 w-5" />
            </div>
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}
