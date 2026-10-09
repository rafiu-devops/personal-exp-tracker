"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { SidebarProvider } from "./sidebar";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { PlusIcon } from "@/components/icons";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-dvh">
        <OfflineBanner />
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-2">{children}</main>

        <Link
          href="/expenses/new"
          aria-label="Add expense"
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-lg shadow-brand/30 transition active:scale-95"
          style={{ right: "max(1rem, calc(50% - 24rem))" }}
        >
          <PlusIcon className="h-7 w-7" />
        </Link>

        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
