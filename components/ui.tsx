"use client";

import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { formatMoney, formatSignedMoney, initials } from "@/lib/format";

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-foreground shadow-sm hover:brightness-110 active:brightness-95",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-muted",
  ghost: "text-foreground/80 hover:bg-surface-muted",
  danger: "bg-negative text-white hover:brightness-110",
  soft: "bg-brand/10 text-brand hover:bg-brand/15",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-xl gap-1.5",
  md: "h-11 px-4 text-sm rounded-2xl gap-2",
  lg: "h-12 px-5 text-base rounded-2xl gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, fullWidth, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
});

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(function IconButton({ className, label, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      aria-label={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 transition hover:bg-surface-muted active:scale-95",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

/* -------------------------------------------------------------------- Card */

export function Card({
  className,
  children,
  as: As = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "li";
}) {
  return (
    <As
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {children}
    </As>
  );
}

export function SectionTitle({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between", className)}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
        {title}
      </h2>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------- Fields */

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground/70">
      {children}
    </label>
  );
}

const FIELD_BASE =
  "w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(FIELD_BASE, className)} {...rest} />;
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(FIELD_BASE, "min-h-[80px] resize-none", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(FIELD_BASE, "appearance-none", className)} {...rest}>
        {children}
      </select>
    );
  }
);

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-negative">{message}</p>;
}

export function FormField({
  label,
  error,
  hint,
  children,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-foreground/45">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

/* ------------------------------------------------------------ Segmented etc */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex rounded-2xl bg-surface-muted p-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition",
            value === opt.value
              ? "bg-surface text-foreground shadow-sm"
              : "text-foreground/55 hover:text-foreground"
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-surface text-foreground/70 hover:bg-surface-muted",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "brand" | "warning";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-muted text-foreground/60",
    positive: "bg-positive/12 text-positive",
    negative: "bg-negative/12 text-negative",
    brand: "bg-brand/12 text-brand",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  size = 40,
  color,
  src,
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  /** Optional avatar image (URL or data URL). Falls back to initials. */
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: color ?? "linear-gradient(135deg,#6366f1,#10b981)",
      }}
    >
      {initials(name)}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-3xl">{icon}</div>}
      <p className="font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-foreground/55">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function MoneyText({
  amount,
  signed,
  currency = "PKR",
  className,
}: {
  amount: number;
  signed?: boolean;
  currency?: string;
  className?: string;
}) {
  const tone = signed && amount !== 0 ? (amount > 0 ? "text-positive" : "text-negative") : "";
  return (
    <span className={cn("tabular-nums", tone, className)}>
      {signed ? formatSignedMoney(amount, currency) : formatMoney(amount, currency)}
    </span>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-muted", className)}>
      <div
        className="h-full rounded-full bg-brand transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------- Sheet */

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-3xl border border-border bg-surface shadow-xl animate-slide-up sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <IconButton label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-border px-5 py-4 safe-bottom">{footer}</div>}
      </div>
    </div>
  );
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  className,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition",
        onClick && "hover:bg-surface-muted active:bg-surface-muted",
        className
      )}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground">{title}</div>
        {subtitle && <div className="truncate text-sm text-foreground/50">{subtitle}</div>}
      </div>
      {trailing}
    </Comp>
  );
}
