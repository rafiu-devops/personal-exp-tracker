"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowLeftIcon } from "@/components/icons";

export function PageHeader({
  title,
  subtitle,
  back,
  leading,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: boolean | string;
  /** Optional slot rendered to the left of the title (e.g. a profile button). */
  leading?: ReactNode;
  actions?: ReactNode;
}) {
  const router = useRouter();
  const showBack = Boolean(back);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-colors duration-200",
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        {leading}
        {showBack &&
          (typeof back === "string" ? (
            <Link
              href={back}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-surface-muted"
              aria-label="Back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-surface-muted"
              aria-label="Back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          ))}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-foreground/55">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}
