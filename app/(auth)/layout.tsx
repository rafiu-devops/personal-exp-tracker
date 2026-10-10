"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui";
import { ExpenzaPinwheelSvg } from "@/components/logo";
import { EXPENZA_BRAND } from "@/lib/theme";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden px-4 py-8 select-none"
      style={{
        background:
          "radial-gradient(circle at 50% 35%, #818cf8 0%, #6366f1 45%, #4f46e5 100%)",
      }}
    >
      {/* Ambient glowing highlights matching the splash screen */}
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 -translate-y-20 translate-x-20 bg-gradient-to-bl from-white/20 to-transparent blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-16 translate-y-16 rounded-full bg-gradient-to-tr from-white/15 via-white/5 to-transparent blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center">
        {/* Brand Header: Logo on the LEFT of EXPENZA text with tagline centered underneath */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center gap-3.5 select-none">
            <div
              className="flex items-center justify-center shrink-0"
              style={{ filter: "drop-shadow(0 0 16px rgba(255,255,255,.55))" }}
            >
              <ExpenzaPinwheelSvg size={52} fill="#ffffff" />
            </div>

            <span
              className="text-3xl font-black italic uppercase leading-none text-white sm:text-4xl"
              style={{
                fontFamily: 'var(--font-orbitron), "Arial Black", sans-serif',
                letterSpacing: "0.22em",
                textShadow:
                  "0 0 25px rgba(255,255,255,.5), 0 0 45px rgba(79,70,229,.4)",
              }}
            >
              <span className="inline-block" style={{ transform: "skewX(-10deg)" }}>
                {EXPENZA_BRAND.wordmark}
              </span>
            </span>
          </div>

          <p
            className="mt-3 text-xs font-semibold uppercase text-white/95 sm:text-sm"
            style={{ letterSpacing: "0.35em", paddingLeft: "0.35em" }}
          >
            {EXPENZA_BRAND.tagline}
          </p>
        </div>

        {/* Content Box */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-7 w-7 text-white" />
          </div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
    </div>
  );
}
