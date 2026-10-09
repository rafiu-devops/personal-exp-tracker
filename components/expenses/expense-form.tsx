"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  FormField,
  Input,
  Label,
  SegmentedControl,
  Select,
  Textarea,
} from "@/components/ui";
import { CategoryPicker } from "./category-picker";
import { SplitEditor } from "./split-editor";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/toast";
import { friendlyError } from "@/lib/errors";
import { todayISO } from "@/lib/format";
import { useOnline } from "@/lib/online";
import { SELF_ID } from "@/lib/types";
import { expenseFormSchema, type ExpenseFormValues } from "@/lib/validation";
import type { Expense } from "@/lib/types";

export function ExpenseForm({
  initial,
  defaultKind = "personal",
  defaultGroupId = "",
}: {
  initial?: Expense;
  defaultKind?: Expense["kind"];
  defaultGroupId?: string;
}) {
  const router = useRouter();
  const { profile } = useAuth();
  const { categories, people, groups, accounts, addExpense, updateExpense } = useData();
  const { toast } = useToast();
  const online = useOnline();
  const [saving, setSaving] = useState(false);

  const defaultValues = useMemo<ExpenseFormValues>(
    () => ({
      kind: initial?.kind ?? defaultKind,
      title: initial?.title ?? "",
      amount: (initial?.amount ?? "") as unknown as number,
      categoryId: initial?.categoryId ?? "",
      date: initial?.date ?? todayISO(),
      note: initial?.note ?? "",
      accountId: initial?.accountId ?? "",
      groupId: initial?.groupId ?? defaultGroupId,
      payerId: initial?.payerId ?? SELF_ID,
      participantIds:
        initial?.participantIds ??
        ((initial?.kind ?? defaultKind) === "shared" ? [SELF_ID] : []),
      splitType: initial?.splitType ?? "equal",
      entries: initial?.splits
        ? initial.splits.map((s) => ({ personId: s.personId, value: s.owedAmount }))
        : [],
    }),
    [initial, defaultKind, defaultGroupId]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema) as Resolver<ExpenseFormValues>,
    defaultValues,
  });

  const kind = watch("kind");
  const categoryId = watch("categoryId");
  const accountId = watch("accountId");
  const payerId = watch("payerId");
  const participantIds = watch("participantIds") ?? [];
  const splitType = watch("splitType");
  const entries = watch("entries") ?? [];
  const groupId = watch("groupId");

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setValue("categoryId", categories[0].id, { shouldValidate: false });
    }
  }, [categoryId, categories, setValue]);

  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setValue("accountId", accounts[0].id, { shouldValidate: false });
    }
  }, [accountId, accounts, setValue]);

  const onSubmit = async (values: ExpenseFormValues) => {
    setSaving(true);
    try {
      if (initial) {
        await updateExpense(initial.id, values);
        toast("Expense updated", "success");
        router.push(`/expenses/${initial.id}`);
      } else {
        const id = await addExpense(values);
        toast("Expense saved", "success");
        // Offline, dynamic routes can't be fetched — go to the (prefetched) list.
        router.push(online ? `/expenses/${id}` : "/expenses");
      }
      router.refresh();
    } catch (error) {
      toast(friendlyError(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const onSelectGroup = (id: string) => {
    setValue("groupId", id);
    const group = groups.find((g) => g.id === id);
    if (group) {
      const members = [SELF_ID, ...group.memberIds.filter((m) => people.some((p) => p.id === m))];
      setValue("participantIds", members, { shouldValidate: false });
      setValue("payerId", SELF_ID, { shouldValidate: false });
      setValue(
        "entries",
        members.map((pid) => ({ personId: pid, value: splitType === "percentage" ? 100 / members.length : 0 }))
      );
    }
  };

  const splitError = (errors as Record<string, { message?: string }>).splitError?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-4" noValidate>
      <SegmentedControl
        value={kind}
        onChange={(next) => {
          setValue("kind", next, { shouldValidate: false });
          if (next === "shared" && participantIds.length === 0) {
            setValue("participantIds", [SELF_ID], { shouldValidate: false });
          }
        }}
        options={[
          { value: "personal", label: "Personal" },
          { value: "shared", label: "Shared" },
        ]}
      />

      <Card className="space-y-4">
        <FormField label="Amount" error={errors.amount?.message}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-foreground/40">
              Rs
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              placeholder="0"
              className="w-full rounded-2xl border border-border bg-surface py-3 pl-12 pr-4 text-2xl font-bold outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              {...register("amount")}
            />
          </div>
        </FormField>

        <FormField label="Title (optional)" error={errors.title?.message}>
          <Input placeholder="e.g. Dinner with friends" {...register("title")} />
        </FormField>

        <FormField label="Category" error={errors.categoryId?.message}>
          <CategoryPicker
            value={categoryId}
            onChange={(id) => setValue("categoryId", id, { shouldValidate: true })}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date" error={errors.date?.message}>
            <Input type="date" {...register("date")} />
          </FormField>
          <FormField label="Account">
            <Select {...register("accountId")}>
              <option value="">Unassigned</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Note (optional)">
          <Textarea placeholder="Anything worth remembering…" {...register("note")} />
        </FormField>
      </Card>

      {kind === "shared" && (
        <Card className="space-y-4">
          <div>
            <Label>Group (optional)</Label>
            <Select value={groupId} onChange={(e) => onSelectGroup(e.target.value)}>
              <option value="">No group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </div>

          <SplitEditor
            amount={Number(watch("amount")) || 0}
            people={people}
            selfName={profile?.name ?? "You"}
            value={{ payerId, participantIds, splitType, entries }}
            onChange={(next) => {
              if (next.payerId !== undefined)
                setValue("payerId", next.payerId, { shouldValidate: true });
              if (next.participantIds !== undefined)
                setValue("participantIds", next.participantIds, { shouldValidate: true });
              if (next.splitType !== undefined)
                setValue("splitType", next.splitType, { shouldValidate: false });
              if (next.entries !== undefined)
                setValue("entries", next.entries, { shouldValidate: false });
            }}
          />

          {(splitError || errors.participantIds?.message || errors.payerId?.message) && (
            <p className="rounded-xl bg-negative/10 px-3 py-2 text-sm text-negative">
              {splitError || errors.participantIds?.message || errors.payerId?.message}
            </p>
          )}
        </Card>
      )}

      <Button type="submit" size="lg" fullWidth loading={saving}>
        {initial ? "Save changes" : "Save expense"}
      </Button>
    </form>
  );
}
