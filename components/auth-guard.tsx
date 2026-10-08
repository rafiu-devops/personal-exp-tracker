"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (!configured) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-4xl">🔧</span>
        <h1 className="text-lg font-semibold">Firebase isn&apos;t configured</h1>
        <p className="max-w-sm text-sm text-foreground/60">
          Add your Firebase keys to <code>.env.local</code> (see{" "}
          <code>.env.example</code>) and restart the dev server.
        </p>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="h-6 w-6 text-brand" />
      </div>
    );
  }

  return <>{children}</>;
}
