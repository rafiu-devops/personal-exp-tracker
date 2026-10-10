"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ExpenzaSplashScreen } from "@/components/splash-screen";

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
    <main
      className="relative min-h-dvh"
      style={{
        background:
          "radial-gradient(circle at 50% 35%, #818cf8 0%, #6366f1 45%, #4f46e5 100%)",
      }}
    >
      <ExpenzaSplashScreen onComplete={handleSplashComplete} />
    </main>
  );
}
