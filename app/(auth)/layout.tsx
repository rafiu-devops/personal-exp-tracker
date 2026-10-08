"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand/20 to-transparent" />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand text-3xl font-bold text-brand-foreground shadow-lg shadow-brand/30">
            ₹
          </div>
          <h1 className="mt-4 text-2xl font-bold">Money Management</h1>
          <p className="mt-1 text-sm text-foreground/55">
            Track spending. Split with friends. Stay in control.
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-brand" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
