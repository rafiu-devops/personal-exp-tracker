"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { Button, Chip, FormField, Input, Sheet } from "@/components/ui";
import { CATEGORY_COLOR_CHOICES, CATEGORY_ICON_CHOICES } from "@/lib/categories";
import { PlusIcon } from "@/components/icons";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

export function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { categories, addCategory } = useData();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CATEGORY_ICON_CHOICES[0]);
  const [color, setColor] = useState(CATEGORY_COLOR_CHOICES[0]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      toast("Enter a category name", "error");
      return;
    }
    setSaving(true);
    try {
      const id = await addCategory({ name: name.trim(), icon, color });
      onChange(id);
      toast("Category added", "success");
      setOpen(false);
      setName("");
    } catch {
      toast("Could not add the category", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Chip
            key={category.id}
            active={value === category.id}
            onClick={() => onChange(category.id)}
          >
            <span>{category.icon}</span>
            {category.name}
          </Chip>
        ))}
        <Chip active={false} onClick={() => setOpen(true)}>
          <PlusIcon className="h-3.5 w-3.5" />
          New
        </Chip>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="New category"
        footer={
          <Button fullWidth onClick={save} loading={saving}>
            Add category
          </Button>
        }
      >
        <div className="space-y-4">
          <FormField label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coffee"
              maxLength={40}
            />
          </FormField>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground/70">Icon</p>
            <div className="grid grid-cols-8 gap-1.5">
              {CATEGORY_ICON_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setIcon(choice)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-xl border text-lg transition",
                    icon === choice
                      ? "border-brand bg-brand/10"
                      : "border-transparent bg-surface-muted"
                  )}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground/70">Colour</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setColor(choice)}
                  aria-label={`Colour ${choice}`}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 ring-offset-surface transition",
                    color === choice ? "ring-2 ring-brand" : ""
                  )}
                  style={{ background: choice }}
                />
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
}
