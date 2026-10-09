"use client";

import React from "react";
import { cn } from "@/lib/cn";

export interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | number;
  variant?: "light" | "dark";
  showWordmark?: boolean;
  className?: string;
  imgClassName?: string;
}

const emblemPixelSizes: Record<string, number> = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

const wordmarkTextSizes: Record<string, string> = {
  sm: "text-base tracking-[0.18em]",
  md: "text-xl tracking-[0.2em]",
  lg: "text-2xl tracking-[0.22em]",
  xl: "text-3xl tracking-[0.25em]",
};

export function Logo({
  size = "md",
  variant = "light",
  showWordmark = true,
  className,
  imgClassName,
}: LogoProps) {
  const pixelSize =
    typeof size === "number" ? size : emblemPixelSizes[size] || emblemPixelSizes.md;
  const emblemSrc =
    variant === "dark" ? "/logo-emblem-white.svg" : "/logo-emblem.svg";

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <img
        src={emblemSrc}
        alt="Expencir Emblem"
        width={pixelSize}
        height={pixelSize}
        className={cn("shrink-0 object-contain", imgClassName)}
        style={{ width: pixelSize, height: pixelSize }}
      />
      {showWordmark && (
        <span
          className={cn(
            "font-[var(--font-orbitron),sans-serif] font-black italic uppercase leading-none",
            variant === "dark" ? "text-white" : "text-foreground",
            typeof size === "string"
              ? wordmarkTextSizes[size] || "text-xl tracking-[0.2em]"
              : "text-xl tracking-[0.2em]"
          )}
        >
          EXPENCIR
        </span>
      )}
    </div>
  );
}

export interface EmblemProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number | string;
  variant?: "light" | "dark" | "white" | "gradient" | "monochrome";
  animated?: boolean;
}

export function ExpencirEmblem({
  size = 48,
  variant = "gradient",
  className,
  ...props
}: EmblemProps) {
  const src =
    variant === "white" || variant === "dark"
      ? "/logo-emblem-white.svg"
      : "/logo-emblem.svg";
  const pixelSize = typeof size === "number" ? size : parseInt(String(size), 10) || 48;

  return (
    <img
      src={src}
      alt="Expencir Emblem"
      width={pixelSize}
      height={pixelSize}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: pixelSize, height: pixelSize }}
      {...props}
    />
  );
}

export { Logo as ExpencirLogo };
export default Logo;
