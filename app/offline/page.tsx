import Link from "next/link";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-5xl">📡</span>
      <h1 className="text-xl font-bold">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-foreground/55">
        MM couldn&apos;t reach the network. Previously loaded data is still available —
        reopen the app, and your changes will sync automatically once you&apos;re back online.
      </p>
      <Link
        href="/dashboard"
        className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground"
      >
        Try again
      </Link>
    </div>
  );
}
