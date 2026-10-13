"use client";

import { useTheme } from "@/components/theme-provider";
import { IconButton } from "@/components/ui";
import { MoonIcon, SunIcon } from "@/components/icons";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  return (
    <IconButton label="Toggle theme" onClick={toggle} className={className}>
      {resolved === "dark" ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </IconButton>
  );
}
