"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Avatar,
  Button,
  Card,
  Chip,
  FormField,
  IconButton,
  Input,
  SectionTitle,
  Sheet,
  Select,
} from "@/components/ui";
import { EditIcon, LogoutIcon, TrashIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { InstallApp } from "@/components/pwa/install-app";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/toast";
import { friendlyError } from "@/lib/errors";
import type { Category } from "@/lib/types";

const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "INR", "AED", "SAR"];

const EMOJI_CHOICES = ["🍔", "🛒", "🚗", "🏠", "💡", "💊", "🎬", "🛍️", "✈️", "📚", "🎁", "📱", "☕", "🐾", "🏋️", "💰"];
const COLOR_CHOICES = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

/** Read an image file, centre-crop it to a square and shrink it to a small data URL. */
async function resizeImageToSquare(file: File, size: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function SettingsPage() {
  const { profile, updateAccount, signOutUser } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory } = useData();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [catOpen, setCatOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState(EMOJI_CHOICES[0]);
  const [catColor, setCatColor] = useState(COLOR_CHOICES[0]);
  const [savingCat, setSavingCat] = useState(false);
  const [confirmCat, setConfirmCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState(false);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile?.name]);

  const saveName = async () => {
    if (!name.trim()) {
      toast("Enter your name", "error");
      return;
    }
    setSavingName(true);
    try {
      await updateAccount({ name: name.trim() });
      toast("Profile updated", "success");
    } catch (error) {
      toast(friendlyError(error), "error");
    } finally {
      setSavingName(false);
    }
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Choose an image file", "error");
      return;
    }
    setSavingPhoto(true);
    try {
      const dataUrl = await resizeImageToSquare(file, 256);
      await updateAccount({ photoURL: dataUrl });
      toast("Profile photo updated", "success");
    } catch {
      toast("Could not update the photo", "error");
    } finally {
      setSavingPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = async () => {
    setSavingPhoto(true);
    try {
      await updateAccount({ photoURL: "" });
      toast("Profile photo removed", "success");
    } catch {
      toast("Could not remove the photo", "error");
    } finally {
      setSavingPhoto(false);
    }
  };

  const changeCurrency = async (currency: string) => {
    try {
      await updateAccount({ currency });
      toast("Currency updated", "success");
    } catch (error) {
      toast(friendlyError(error), "error");
    }
  };

  const openNewCategory = () => {
    setEditingCat(null);
    setCatName("");
    setCatIcon(EMOJI_CHOICES[0]);
    setCatColor(COLOR_CHOICES[0]);
    setCatOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCat(category);
    setCatName(category.name);
    setCatIcon(category.icon);
    setCatColor(category.color);
    setCatOpen(true);
  };

  const saveCategory = async () => {
    if (!catName.trim()) {
      toast("Enter a category name", "error");
      return;
    }
    setSavingCat(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, { name: catName.trim(), icon: catIcon, color: catColor });
        toast("Category updated", "success");
      } else {
        await addCategory({ name: catName.trim(), icon: catIcon, color: catColor });
        toast("Category added", "success");
      }
      setCatOpen(false);
    } catch (error) {
      toast(friendlyError(error), "error");
    } finally {
      setSavingCat(false);
    }
  };

  const removeCategory = async () => {
    if (!confirmCat) return;
    setDeletingCat(true);
    try {
      await deleteCategory(confirmCat.id);
      toast("Category deleted", "success");
      setConfirmCat(null);
    } catch {
      toast("Could not delete the category", "error");
    } finally {
      setDeletingCat(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        actions={
          <IconButton
            label="Sign out"
            onClick={() => signOutUser()}
            className="text-foreground/70 hover:bg-negative/10 hover:text-negative"
          >
            <LogoutIcon className="h-5 w-5" />
          </IconButton>
        }
      />

      <div>
        <SectionTitle title="Profile" />
        <Card className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative shrink-0"
              aria-label="Change profile photo"
            >
              <Avatar name={profile?.name ?? "You"} src={profile?.photoURL} size={64} />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-brand text-[11px] text-brand-foreground">
                {savingPhoto ? "…" : "✎"}
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{profile?.name ?? "You"}</p>
              <p className="truncate text-sm text-foreground/55">{profile?.email}</p>
              <div className="mt-1.5 flex gap-3 text-xs font-semibold">
                <button
                  type="button"
                  className="text-brand"
                  onClick={() => fileRef.current?.click()}
                >
                  {profile?.photoURL ? "Change photo" : "Upload photo"}
                </button>
                {profile?.photoURL && (
                  <button type="button" className="text-negative" onClick={removePhoto}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </div>
          <FormField label="Display name">
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
              <Button variant="secondary" loading={savingName} onClick={saveName}>
                Save
              </Button>
            </div>
          </FormField>
          <FormField label="Currency" hint="Used across the app for all amounts.">
            <Select value={profile?.currency ?? "PKR"} onChange={(e) => changeCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FormField>
        </Card>
      </div>

      <div>
        <SectionTitle
          title="Categories"
          action={
            <button type="button" onClick={openNewCategory} className="text-xs font-semibold text-brand">
              Add
            </button>
          }
        />
        <Card className="divide-y divide-border p-0">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                style={{ background: `${category.color}22` }}
              >
                {category.icon}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</span>
              {category.isDefault && <span className="text-[10px] text-foreground/40">default</span>}
              <button
                type="button"
                onClick={() => openEditCategory(category)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 hover:bg-surface-muted"
                aria-label="Edit category"
              >
                <EditIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmCat(category)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-negative hover:bg-negative/10"
                aria-label="Delete category"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Card>
      </div>

      <div>
        <SectionTitle title="Appearance" />
        <Card className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-foreground/55">Switch between light and dark.</p>
          </div>
          <ThemeToggle />
        </Card>
      </div>

      <div>
        <SectionTitle title="Install" />
        <InstallApp />
      </div>

      <p className="pt-2 text-center text-xs text-foreground/40">
        Expenza · v1.0 · Smart Expense Tracker
      </p>

      {/* Category form */}
      <Sheet
        open={catOpen}
        onClose={() => setCatOpen(false)}
        title={editingCat ? "Edit category" : "New category"}
        footer={
          <Button fullWidth loading={savingCat} onClick={saveCategory}>
            {editingCat ? "Save changes" : "Add category"}
          </Button>
        }
      >
        <div className="space-y-4">
          <FormField label="Name">
            <Input value={catName} onChange={(e) => setCatName(e.target.value)} maxLength={40} placeholder="e.g. Groceries" />
          </FormField>
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground/70">Icon</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_CHOICES.map((emoji) => (
                <Chip key={emoji} active={catIcon === emoji} onClick={() => setCatIcon(emoji)}>
                  <span className="text-base">{emoji}</span>
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground/70">Colour</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_CHOICES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCatColor(color)}
                  className={
                    "h-8 w-8 rounded-full transition " +
                    (catColor === color ? "ring-2 ring-offset-2 ring-offset-surface ring-brand" : "")
                  }
                  style={{ background: color }}
                  aria-label={`Colour ${color}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-surface-muted p-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
              style={{ background: `${catColor}22` }}
            >
              {catIcon}
            </span>
            <span className="text-sm font-medium">{catName || "Preview"}</span>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={confirmCat !== null}
        onClose={() => setConfirmCat(null)}
        title="Delete category?"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setConfirmCat(null)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth loading={deletingCat} onClick={removeCategory}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground/70">
          Past expenses keep their category name. New expenses won&apos;t show this category.
        </p>
      </Sheet>
    </div>
  );
}
