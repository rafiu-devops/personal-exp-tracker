"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  MoneyText,
  SectionTitle,
  Sheet,
  Spinner,
} from "@/components/ui";
import { EditIcon, TrashIcon } from "@/components/icons";
import { SettlementSheet, type SettlementPreset } from "@/components/settlement/settlement-sheet";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/toast";
import { computeSelfLedger } from "@/lib/balances";
import { formatDate, formatMoney } from "@/lib/format";
import { SELF_ID } from "@/lib/types";

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const {
    expenses,
    settlements,
    groups,
    resolveCategory,
    resolveName,
    resolveAccount,
    deleteExpense,
    loading,
  } = useData();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [preset, setPreset] = useState<SettlementPreset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currency = profile?.currency ?? "PKR";
  const expense = expenses.find((e) => e.id === params.id);
  const ledger = useMemo(() => computeSelfLedger(expenses, settlements), [expenses, settlements]);

  if (!expense) {
    return (
      <div>
        <PageHeader title="Expense" back="/expenses" />
        <div className="py-16">
          {loading ? (
            <div className="flex justify-center">
              <Spinner className="h-6 w-6 text-brand" />
            </div>
          ) : (
            <EmptyState
              icon="🤔"
              title="Expense not found"
              description="It may have been deleted."
              action={
                <Link href="/expenses" className="font-semibold text-brand">
                  Back to expenses
                </Link>
              }
            />
          )}
        </div>
      </div>
    );
  }

  const category = resolveCategory(expense.categoryId);
  const group = groups.find((g) => g.id === expense.groupId);
  const account = expense.accountId ? resolveAccount(expense.accountId) : undefined;
  const isShared = expense.kind === "shared";
  const payerIsSelf = expense.payerId === SELF_ID;
  const selfSplit = expense.splits.find((s) => s.personId === SELF_ID);
  const others = expense.splits.filter((s) => s.personId !== SELF_ID);

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteExpense(expense.id);
      toast("Expense deleted", "success");
      router.push("/expenses");
      router.refresh();
    } catch {
      toast("Could not delete the expense", "error");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={expense.title?.trim() || category?.name || "Expense"}
        subtitle={`${category?.icon ?? ""} ${category?.name ?? "Uncategorised"} · ${formatDate(expense.date)}`}
        back="/expenses"
        actions={
          <div className="flex items-center gap-1">
            <Link
              href={`/expenses/${expense.id}/edit`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-surface-muted"
              aria-label="Edit"
            >
              <EditIcon className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-negative transition hover:bg-negative/10"
              aria-label="Delete"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        }
      />

      <Card className="text-center">
        <p className="text-sm text-foreground/50">{isShared ? "Total amount" : "Amount"}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {formatMoney(expense.amount, currency)}
        </p>
        {isShared && selfSplit && (
          <p className="mt-1 text-sm text-foreground/55">
            Your share: <strong>{formatMoney(selfSplit.owedAmount, currency)}</strong>
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {isShared ? <Badge tone="brand">Shared</Badge> : <Badge>Personal</Badge>}
          {group && <Badge tone="neutral">{group.name}</Badge>}
          {account && (
            <Badge tone="neutral">
              {account.icon} {account.name}
            </Badge>
          )}
        </div>
      </Card>

      {expense.note && (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Note</p>
          <p className="mt-1 text-sm text-foreground/80">{expense.note}</p>
        </Card>
      )}

      {isShared && (
        <>
          <Card className="space-y-3">
            <p className="text-sm text-foreground/70">
              <strong>{resolveName(expense.payerId)}</strong> paid{" "}
              <strong>{formatMoney(expense.amount, currency)}</strong>
            </p>
            <div className="space-y-2">
              {expense.splits.map((split) => {
                const people = split.personId === SELF_ID ? "You" : resolveName(split.personId);
                return (
                  <div key={split.personId} className="flex items-center gap-3">
                    <Avatar
                      name={split.personId === SELF_ID ? profile?.name ?? "You" : resolveName(split.personId)}
                      size={34}
                    />
                    <span className="flex-1 text-sm">{people}</span>
                    <MoneyText amount={split.owedAmount} currency={currency} className="text-sm font-medium" />
                    {split.personId === expense.payerId && <Badge tone="brand">paid</Badge>}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Position and settle actions */}
          <div>
            <SectionTitle title="Settlement" />
            <Card className="space-y-3">
              {payerIsSelf ? (
                others.length === 0 ? (
                  <p className="text-sm text-foreground/60">No other participants to settle with.</p>
                ) : (
                  others.map((split) => {
                    const net = ledger.get(split.personId) ?? 0;
                    return (
                      <div key={split.personId} className="flex items-center gap-3">
                        <Avatar name={resolveName(split.personId)} size={34} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {resolveName(split.personId)}
                          </p>
                          <p className="text-xs text-foreground/50">
                            {net >= 0 ? "owes you" : "you owe"} {formatMoney(Math.abs(net), currency)}
                          </p>
                        </div>
                        {net > 0 && (
                          <Button
                            size="sm"
                            variant="soft"
                            onClick={() =>
                              setPreset({
                                personId: split.personId,
                                direction: "theyOwe",
                                amount: net,
                              })
                            }
                          >
                            Settle
                          </Button>
                        )}
                      </div>
                    );
                  })
                )
              ) : expense.participantIds.includes(SELF_ID) ? (
                <div className="flex items-center gap-3">
                  <Avatar name={resolveName(expense.payerId)} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">You owe {resolveName(expense.payerId)}</p>
                    <p className="text-xs text-foreground/50">
                      Your share {formatMoney(selfSplit?.owedAmount ?? 0, currency)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() =>
                      setPreset({
                        personId: expense.payerId,
                        direction: "iOwe",
                        amount: selfSplit?.owedAmount ?? 0,
                      })
                    }
                  >
                    Settle
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-foreground/60">
                  You are not part of this expense, so it doesn&apos;t affect your balance.
                </p>
              )}
            </Card>
          </div>
        </>
      )}

      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete expense?"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth loading={deleting} onClick={remove}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground/70">
          This permanently removes the expense. Any shared balances will recalculate
          automatically.
        </p>
      </Sheet>

      <SettlementSheet
        open={preset !== null}
        onClose={() => setPreset(null)}
        preset={preset ?? undefined}
        groupId={expense.groupId}
      />
    </div>
  );
}
