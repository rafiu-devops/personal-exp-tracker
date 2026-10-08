"use client";

import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-center text-xs font-semibold text-white">
      <span className="h-2 w-2 rounded-full bg-white/90" />
      You&apos;re offline. Showing saved data — changes will sync automatically.
    </div>
  );
}
