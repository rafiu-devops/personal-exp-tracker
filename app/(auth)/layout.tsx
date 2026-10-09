"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui";
import { Logo } from "@/components/logo";
import { EXPENCIR_BRAND } from "@/lib/theme";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand/20 via-brand/5 to-transparent" />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="xl" variant="light" showWordmark />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            {EXPENCIR_BRAND.tagline}
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
