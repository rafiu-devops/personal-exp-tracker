"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast";
import { AuthProvider } from "@/lib/auth-context";
import { DataProvider } from "@/lib/data-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>{children}</DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
