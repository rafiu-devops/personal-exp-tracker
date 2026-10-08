import type { Category } from "./types";

export const DEFAULT_CATEGORIES: Array<
  Pick<Category, "name" | "icon" | "color" | "isDefault">
> = [
  { name: "Food", icon: "🍔", color: "#f97316", isDefault: true },
  { name: "Groceries", icon: "🛒", color: "#22c55e", isDefault: true },
  { name: "Transport", icon: "🚕", color: "#3b82f6", isDefault: true },
  { name: "Shopping", icon: "🛍️", color: "#ec4899", isDefault: true },
  { name: "Bills", icon: "🧾", color: "#6366f1", isDefault: true },
  { name: "Rent", icon: "🏠", color: "#8b5cf6", isDefault: true },
  { name: "Health", icon: "💊", color: "#ef4444", isDefault: true },
  { name: "Entertainment", icon: "🎬", color: "#f59e0b", isDefault: true },
  { name: "Education", icon: "📚", color: "#14b8a6", isDefault: true },
  { name: "Travel", icon: "✈️", color: "#0ea5e9", isDefault: true },
  { name: "Other", icon: "📦", color: "#64748b", isDefault: true },
];

export const CATEGORY_ICON_CHOICES = [
  "🍔", "🛒", "🚕", "🛍️", "🧾", "🏠", "💊", "🎬", "📚", "✈️",
  "📦", "☕", "🍕", "⛽", "🚌", "💡", "📱", "🎁", "💼", "🏋️",
  "🐶", "👕", "🎮", "✂️", "💄", "🧾", "💳", "🎓", "🧹", "❤️",
];

export const CATEGORY_COLOR_CHOICES = [
  "#f97316", "#22c55e", "#3b82f6", "#ec4899", "#6366f1",
  "#8b5cf6", "#ef4444", "#f59e0b", "#14b8a6", "#0ea5e9",
  "#64748b", "#84cc16", "#d946ef", "#06b6d4",
];
