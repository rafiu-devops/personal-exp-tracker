"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [user, loading, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-brand-foreground">
        ₹
      </div>
      <Spinner className="h-5 w-5 text-brand" />
      <p className="text-sm text-foreground/50">Loading Money Management…</p>
    </div>
  );
}
