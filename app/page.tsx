"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ExpencirSplashScreen } from "@/components/splash-screen";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [animationFinished, setAnimationFinished] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setAnimationFinished(true);
  }, []);

  useEffect(() => {
    // Wait until both the splash screen animation completes and auth state loading is finished
    if (animationFinished && !loading) {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [animationFinished, loading, user, router]);

  return (
    <main className="relative min-h-dvh bg-[#0B1020]">
      <ExpencirSplashScreen onComplete={handleSplashComplete} />
    </main>
  );
}
