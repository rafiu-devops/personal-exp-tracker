"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/icons";

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: boolean | string;
  actions?: ReactNode;
}) {
  const router = useRouter();
  const showBack = Boolean(back);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
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
