"use client";

import React from "react";
import { cn } from "@/lib/cn";

export interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | number;
  variant?: "light" | "dark" | "white";
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

// MASTER 6-BLADE ORGANIC SWOOSH PATH (matching splash screen 1:1)
export const BLADE_PATH =
  "M44.7 239.7 L45.3 243.2 L49.0 250.2 L54.0 258.8 L61.1 269.4 L66.9 276.9 L73.0 284.0 L79.4 290.7 L86.1 296.8 L92.9 302.5 L100.0 307.7 L107.2 312.3 L114.5 316.5 L122.0 320.1 L129.5 323.2 L137.1 325.7 L144.9 327.8 L152.5 329.3 L160.0 330.2 L167.4 330.7 L176.9 330.4 L184.0 329.7 L191.1 328.4 L199.8 325.9 L206.3 323.4 L214.1 319.6 L219.6 316.1 L225.1 312.0 L229.9 307.6 L235.4 301.3 L239.2 295.9 L242.6 289.8 L244.6 284.8 L244.6 281.3 L243.3 278.1 L241.3 275.9 L238.2 274.3 L234.7 274.0 L226.8 275.6 L220.8 276.3 L212.8 276.4 L207.2 276.0 L199.5 274.9 L194.1 273.6 L186.6 271.2 L179.3 268.1 L168.1 261.7 L157.5 253.6 L148.0 244.1 L139.7 233.3 L132.5 221.3 L126.7 208.3 L123.0 197.0 L119.8 182.6 L118.6 173.6 L117.9 164.4 L117.8 155.1 L118.3 145.7 L120.3 129.6 L122.3 120.1 L124.7 111.0 L124.9 108.7 L124.3 105.8 L122.8 103.3 L120.6 101.4 L117.8 100.3 L114.3 100.2 L110.6 101.8 L102.5 109.8 L95.4 117.6 L87.2 127.7 L79.8 138.2 L74.1 147.1 L67.8 158.3 L63.2 167.8 L59.1 177.3 L55.5 187.1 L52.4 197.0 L49.7 207.1 L47.6 217.2 L45.9 227.5 L44.7 239.7 Z";

export function ExpenzaPinwheelSvg({
  size = 48,
  fill = "currentColor",
  className,
}: {
  size?: number | string;
  fill?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="expenzaEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <g>
        <path d={BLADE_PATH} fill={fill} transform="rotate(0 256 256)" />
        <path d={BLADE_PATH} fill={fill} transform="rotate(60 256 256)" />
        <path d={BLADE_PATH} fill={fill} transform="rotate(120 256 256)" />
        <path d={BLADE_PATH} fill={fill} transform="rotate(180 256 256)" />
        <path d={BLADE_PATH} fill={fill} transform="rotate(240 256 256)" />
        <path d={BLADE_PATH} fill={fill} transform="rotate(300 256 256)" />
      </g>
    </svg>
  );
}

export function Logo({
  size = "md",
  variant = "light",
  showWordmark = true,
  className,
  imgClassName,
}: LogoProps) {
  const pixelSize =
    typeof size === "number" ? size : emblemPixelSizes[size] || emblemPixelSizes.md;

  const isDarkOrWhite = variant === "dark" || variant === "white";
  const emblemFill = isDarkOrWhite ? "#FFFFFF" : "url(#expenzaEmblemGrad)";

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <ExpenzaPinwheelSvg
        size={pixelSize}
        fill={emblemFill}
        className={cn("shrink-0", imgClassName)}
      />
      {showWordmark && (
        <span
          className={cn(
            "font-[var(--font-orbitron),sans-serif] font-black italic uppercase leading-none",
            isDarkOrWhite ? "text-white" : "text-foreground",
            typeof size === "string"
              ? wordmarkTextSizes[size] || "text-xl tracking-[0.2em]"
              : "text-xl tracking-[0.2em]"
          )}
          style={
            isDarkOrWhite
              ? {
                  textShadow:
                    "0 0 25px rgba(255,255,255,.5), 0 0 45px rgba(79,70,229,.4)",
                }
              : undefined
          }
        >
          EXPENZA
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

export function ExpenzaEmblem({
  size = 48,
  variant = "gradient",
  className,
  ...props
}: EmblemProps) {
  const isWhite = variant === "white" || variant === "dark";
  const fill = isWhite ? "#FFFFFF" : "url(#expenzaEmblemGrad)";
  const pixelSize = typeof size === "number" ? size : parseInt(String(size), 10) || 48;

  return (
    <ExpenzaPinwheelSvg
      size={pixelSize}
      fill={fill}
      className={className}
    />
  );
}

export const ExpencirEmblem = ExpenzaEmblem;
export { Logo as ExpenzaLogo, Logo as ExpencirLogo };
export default Logo;
