const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: "Rs",
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AED: "AED",
  SAR: "SAR",
};

export function currencySymbol(currency = "PKR"): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function formatMoney(amount: number, currency = "PKR"): string {
  const symbol = currencySymbol(currency);
  return `${symbol} ${Math.round(amount).toLocaleString("en-US")}`;
}

export function formatSignedMoney(amount: number, currency = "PKR"): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(amount), currency)}`;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function monthKey(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
}

export function currentMonthKey(): string {
  return monthKey(new Date());
}

export function startOfMonthISO(date = new Date()): string {
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonthISO(date = new Date()): string {
  return toISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const today = toISODate(new Date());
  const yesterday = toISODate(new Date(Date.now() - 86400000));
  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
