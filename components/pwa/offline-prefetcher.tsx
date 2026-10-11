"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnline } from "@/lib/online";

/**
 * Static (URL-agnostic) routes that render entity details from client state.
 * Prefetching them while online means offline soft-navigation has the RSC
 * payload cached and can render without the network.
 */
const ROUTES = ["/expenses/detail", "/expenses/edit", "/groups/detail"];

export function OfflinePrefetcher() {
  const router = useRouter();
  const online = useOnline();

  useEffect(() => {
    if (!online) return;
    for (const route of ROUTES) {
      try {
        router.prefetch(route);
      } catch {
        // Prefetching is best-effort; ignore failures.
      }
    }
  }, [online, router]);

  return null;
}
