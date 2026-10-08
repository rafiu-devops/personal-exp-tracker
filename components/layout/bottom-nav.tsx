"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  GroupIcon,
  HomeIcon,
  ReceiptIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/icons";

const NAV = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/expenses", label: "Expenses", Icon: ReceiptIcon },
  { href: "/groups", label: "Groups", Icon: GroupIcon },
  { href: "/people", label: "People", Icon: UsersIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md safe-bottom">
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between px-2">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition",
                  active ? "text-brand" : "text-foreground/50 hover:text-foreground/80"
                )}
              >
                <Icon className={cn("h-6 w-6", active && "drop-shadow-sm")} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
