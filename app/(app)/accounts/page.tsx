"use client";

import { useMemo, useCallback, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  FormField,
  Input,
  Label,
  SectionTitle,
  Select,
  Sheet,
  Textarea,
} from "@/components/ui";
import {
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  TransferIcon,
  TrashIcon,
} from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useBalanceVisibility } from "@/lib/balance-visibility";
import { useToast } from "@/components/toast";
import { friendlyError } from "@/lib/errors";
import {
  ACCOUNT_TYPES,
  DEFAULT_ACCOUNTS,
  accountTypeMeta,
  computeAccountBalances,
  monthBudget,
  totalAccountBalance,
} from "@/lib/accounts";
import { currentMonthKey, formatDate, formatMoney, todayISO } from "@/lib/format";
import type { Account, AccountType } from "@/lib/types";

const ICON_CHOICES = ["💵", "👛", "🏦", "💳", "💰", "🪙", "📱", "🏧", "🧾", "🎁"];
const COLOR_CHOICES = ["#22c55e", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#64748b"];

export default function AccountsPage() {
  const { profile } = useAuth();
  const {
    accounts,
    expenses,
    settlements,
    incomes,
    transfers,
    addAccount,
    updateAccount,
    deleteAccount,
    addIncome,
    deleteIncome,
    addTransfer,
    deleteTransfer,
  } = useData();
  const { hidden, toggle } = useBalanceVisibility();
  const { toast } = useToast();
  const currency = profile?.currency ?? "PKR";

  const balances = useMemo(
    () => computeAccountBalances(accounts, expenses, settlements, incomes, transfers),
    [accounts, expenses, settlements, incomes, transfers]
  );
  const balanceById = useMemo(
    () => new Map(balances.map((b) => [b.accountId, b])),
    [balances]
  );
  const netWorth = useMemo(() => totalAccountBalance(balances), [balances]);

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const budget = useMemo(
    () => monthBudget(accounts, expenses, incomes, currentMonthKey()),
    [accounts, expenses, incomes]
  );
  const monthLabel = new Date(`${budget.month}-01T00:00:00`).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const accountName = useCallback(
    (id: string) => accountById.get(id)?.name ?? "Account",
    [accountById]
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("cash");
  const [opening, setOpening] = useState("0");
  const [icon, setIcon] = useState("💵");
  const [color, setColor] = useState("#22c55e");
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<Account | null>(null);
  const [confirm, setConfirm] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [incomeOpen, setIncomeOpen] = useState(false);
  const [incomeAccountId, setIncomeAccountId] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(todayISO());
  const [incomeNote, setIncomeNote] = useState("");
  const [savingIncome, setSavingIncome] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(todayISO());
  const [transferNote, setTransferNote] = useState("");
  const [savingTransfer, setSavingTransfer] = useState(false);

  const openNew = () => {
    setEditing(null);
    setName("");
    setType("cash");
    setOpening("0");
    setIcon("💵");
    setColor("#22c55e");
    setFormOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditing(account);
    setName(account.name);
    setType(account.type);
    setOpening(String(account.openingBalance));
    setIcon(account.icon);
    setColor(account.color);
    setFormOpen(true);
  };

  const chooseType = (next: AccountType) => {
    setType(next);
    const meta = accountTypeMeta(next);
    if (!editing) {
      setIcon(meta.icon);
      setColor(meta.color);
    }
  };

  const saveAccount = async () => {
    if (!name.trim()) {
      toast("Enter an account name", "error");
      return;
    }
    setSaving(true);
    try {
      const values = {
        name: name.trim(),
        type,
        openingBalance: Math.round(Number(opening) || 0),
        icon,
        color,
      };
      if (editing) {
        await updateAccount(editing.id, values);
        toast("Account updated", "success");
      } else {
        await addAccount(values);
        toast("Account added", "success");
      }
      setFormOpen(false);
    } catch (error) {
      toast(friendlyError(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const setUpDefaults = async () => {
    setSaving(true);
    try {
      for (const account of DEFAULT_ACCOUNTS) {
        await addAccount({
          name: account.name,
          type: account.type,
          openingBalance: account.openingBalance,
          icon: account.icon,
          color: account.color,
        });
      }
      toast("Default accounts created", "success");
    } catch (error) {
      toast(friendlyError(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const openIncome = (accountId: string) => {
    setIncomeAccountId(accountId);
    setIncomeAmount("");
    setIncomeDate(todayISO());
    setIncomeNote("");
    setIncomeOpen(true);
  };

  const saveIncome = async () => {
    const amount = Math.round(Number(incomeAmount));
    if (!incomeAccountId) {
      toast("Choose an account", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast("Enter an amount greater than 0", "error");
      return;
    }
    setSavingIncome(true);
    try {
      await addIncome({ accountId: incomeAccountId, amount, date: incomeDate, note: incomeNote });
      toast("Income added", "success");
      setIncomeOpen(false);
    } catch (error) {
      toast(friendlyError(error), "error");
    } finally {
      setSavingIncome(false);
    }
  };

  const openTransfer = (fromAccountId?: string) => {
    const source = fromAccountId || accounts[0]?.id || "";
    const target = accounts.find((a) => a.id !== source)?.id || source;
    setTransferFrom(source);
    setTransferTo(target);
    setTransferAmount("");
    setTransferDate(todayISO());
    setTransferNote("");
    setTransferOpen(true);
  };

  const saveTransfer = async () => {
    const amount = Math.round(Number(transferAmount));
    if (!transferFrom || !transferTo) {
      toast("Choose both accounts", "error");
      return;
    }
    if (transferFrom === transferTo) {
      toast("Source and destination must be different", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast("Enter an amount greater than 0", "error");
      return;
    }
    setSavingTransfer(true);
    try {
      await addTransfer({
        fromAccountId: transferFrom,
        toAccountId: transferTo,
        amount,
        date: transferDate,
        note: transferNote,
      });
      toast("Transfer done", "success");
      setTransferOpen(false);
    } catch (error) {
      toast(friendlyError(error), "error");
    } finally {
      setSavingTransfer(false);
    }
  };

  const removeAccount = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteAccount(confirm.id);
      toast("Account removed", "success");
      setConfirm(null);
      setDetail(null);
    } catch {
      toast("Could not remove the account", "error");
    } finally {
      setDeleting(false);
    }
  };

  const detailActivity = useMemo(() => {
    if (!detail) return [];
    const rows: Array<{
      key: string;
      date: string;
      label: string;
      amount: number;
      tone?: "positive" | "negative" | "neutral";
    }> = [];
    for (const income of incomes) {
      if (income.accountId !== detail.id) continue;
      rows.push({
        key: `i-${income.id}`,
        date: income.date,
        label: income.note?.trim() || "Income",
        amount: income.amount,
      });
    }
    for (const expense of expenses) {
      if (expense.accountId !== detail.id || expense.payerId !== "self") continue;
      rows.push({
        key: `e-${expense.id}`,
        date: expense.date,
        label: expense.title,
        amount: -expense.amount,
      });
    }
    for (const settlement of settlements) {
      if (settlement.accountId !== detail.id) continue;
      const delta =
        settlement.toPersonId === "self"
          ? settlement.amount
          : settlement.fromPersonId === "self"
            ? -settlement.amount
            : 0;
      if (delta === 0) continue;
      rows.push({
        key: `s-${settlement.id}`,
        date: settlement.date,
        label: settlement.note?.trim() || "Settlement",
        amount: delta,
      });
    }
    for (const transfer of transfers) {
      if (transfer.fromAccountId === detail.id) {
        rows.push({
          key: `tf-${transfer.id}`,
          date: transfer.date,
          label: `Transfer out → ${accountName(transfer.toAccountId)}`,
          amount: -transfer.amount,
          tone: "neutral",
        });
      } else if (transfer.toAccountId === detail.id) {
        rows.push({
          key: `tf-${transfer.id}`,
          date: transfer.date,
          label: `Transfer in ← ${accountName(transfer.fromAccountId)}`,
          amount: transfer.amount,
          tone: "neutral",
        });
      }
    }
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [detail, incomes, expenses, settlements, transfers, accountName]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Accounts"
        subtitle="Cash, wallet, savings & cards"
        actions={
          <div className="flex items-center gap-2">
            {accounts.length > 1 && (
              <button
                type="button"
                onClick={() => openTransfer()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-foreground/70"
                aria-label="Transfer between accounts"
              >
                <TransferIcon className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={openNew}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand"
              aria-label="Add account"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        }
      />

      <Card className="bg-gradient-to-br from-brand to-indigo-500 text-brand-foreground">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm/relaxed opacity-80">Total balance</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {hidden ? "••••••" : formatMoney(netWorth, currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={hidden ? "Show balances" : "Hide balances"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 active:scale-95"
          >
            {hidden ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
      </Card>

      {accounts.length > 0 && (
        <Card
          className={budget.overspent.length > 0 ? "border border-negative/40 bg-negative/5" : ""}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{monthLabel} budget</p>
              <p className="text-[11px] text-foreground/45">
                Income set this month minus what you spent
              </p>
            </div>
            <p
              className={
                "shrink-0 text-sm font-semibold tabular-nums " +
                (budget.totalBalance < 0 ? "text-negative" : "text-positive")
              }
            >
              {hidden
                ? "••••"
                : budget.totalBalance < 0
                  ? `−${formatMoney(-budget.totalBalance, currency)}`
                  : `${formatMoney(budget.totalBalance, currency)} left`}
            </p>
          </div>

          {budget.overspent.length > 0 && (
            <div className="mt-3 rounded-xl border border-negative/30 bg-negative/10 p-3">
              <p className="text-sm font-semibold text-negative">
                Settle your this month budget
              </p>
              <p className="mt-1 text-xs leading-relaxed text-negative/80">
                {budget.overspent
                  .map(
                    (entry) =>
                      `${accountName(entry.accountId)} overspent by ${formatMoney(
                        -entry.balance,
                        currency
                      )}`
                  )
                  .join(" · ")}
                . Your budget went into the minus — add income to cover it.
              </p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => openIncome(budget.overspent[0].accountId)}
              >
                Add income to settle
              </Button>
            </div>
          )}

          <div className="mt-3 space-y-3">
            {budget.entries
              .filter((entry) => entry.income > 0 || entry.spent > 0)
              .map((entry) => {
                const account = accountById.get(entry.accountId);
                if (!account) return null;
                const ratio = entry.income > 0 ? Math.min(entry.spent / entry.income, 1) : 1;
                return (
                  <div key={entry.accountId}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium">
                        {account.icon} {account.name}
                      </span>
                      <span
                        className={
                          "shrink-0 tabular-nums " +
                          (entry.balance < 0
                            ? "font-semibold text-negative"
                            : "text-foreground/60")
                        }
                      >
                        {hidden
                          ? "••"
                          : `${formatMoney(entry.spent, currency)} / ${formatMoney(
                              entry.income,
                              currency
                            )}`}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className={
                          "h-full rounded-full " +
                          (entry.balance < 0 ? "bg-negative" : "bg-brand")
                        }
                        style={{ width: `${Math.max(ratio * 100, entry.spent > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {budget.entries.every((entry) => entry.income === 0 && entry.spent === 0) && (
              <p className="text-sm text-foreground/55">
                No income or spending recorded for {monthLabel} yet.
              </p>
            )}
          </div>
        </Card>
      )}

      {accounts.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No accounts yet"
          description="Create cash, wallet, savings and card accounts with an opening balance to track every rupee."
          action={
            <Button loading={saving} onClick={setUpDefaults}>
              Create default accounts
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => {
            const bucket = balanceById.get(account.id);
            const meta = accountTypeMeta(account.type);
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => setDetail(account)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left transition hover:bg-surface-muted"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
                  style={{ background: `${account.color}22` }}
                >
                  {account.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{account.name}</p>
                  <p className="truncate text-xs text-foreground/50">{meta.label}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">
                    {hidden ? "••••" : formatMoney(bucket?.balance ?? 0, currency)}
                  </p>
                  {bucket && bucket.income > 0 && (
                    <p className="text-[11px] text-positive">
                      {hidden ? "••" : `+${formatMoney(bucket.income, currency)}`}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={openNew}>
              <PlusIcon className="h-4 w-4" /> Add account
            </Button>
            {accounts.length > 1 && (
              <Button variant="secondary" fullWidth onClick={() => openTransfer()}>
                <TransferIcon className="h-4 w-4" /> Transfer
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Add / edit account */}
      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit account" : "New account"}
        footer={
          <Button fullWidth loading={saving} onClick={saveAccount}>
            {editing ? "Save changes" : "Add account"}
          </Button>
        }
      >
        <div className="space-y-4">
          <FormField label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="e.g. HBL Debit Card"
            />
          </FormField>

          <div>
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_TYPES.map((meta) => (
                <Chip
                  key={meta.type}
                  active={type === meta.type}
                  onClick={() => chooseType(meta.type)}
                >
                  <span>{meta.icon}</span>
                  {meta.label}
                </Chip>
              ))}
            </div>
          </div>

          <FormField label="Opening balance" hint="The amount in this account before tracking.">
            <Input
              type="number"
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="0"
            />
          </FormField>

          <div>
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_CHOICES.map((emoji) => (
                <Chip key={emoji} active={icon === emoji} onClick={() => setIcon(emoji)}>
                  <span className="text-base">{emoji}</span>
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label>Colour</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_CHOICES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={
                    "h-8 w-8 rounded-full transition " +
                    (color === c ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : "")
                  }
                  style={{ background: c }}
                  aria-label={`Colour ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Sheet>

      {/* Account detail */}
      <Sheet
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ""}
        footer={
          detail ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" fullWidth onClick={() => openEdit(detail)}>
                <EditIcon className="h-4 w-4" /> Edit
              </Button>
              <Button variant="soft" fullWidth onClick={() => openIncome(detail.id)}>
                <PlusIcon className="h-4 w-4" /> Income
              </Button>
              {accounts.length > 1 && (
                <Button
                  variant="soft"
                  fullWidth
                  onClick={() => {
                    openTransfer(detail.id);
                    setDetail(null);
                  }}
                >
                  <TransferIcon className="h-4 w-4" /> Transfer
                </Button>
              )}
            </div>
          ) : null
        }
      >
        {detail && (
          <div className="space-y-4">
            <Card className="text-center">
              <p className="text-sm text-foreground/50">Current balance</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {hidden ? "••••••" : formatMoney(balanceById.get(detail.id)?.balance ?? 0, currency)}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs">
                <Badge tone="neutral">Opening {formatMoney(detail.openingBalance, currency)}</Badge>
                <Badge tone="positive">
                  Income {formatMoney(balanceById.get(detail.id)?.income ?? 0, currency)}
                </Badge>
                <Badge tone="negative">
                  Spent {formatMoney(balanceById.get(detail.id)?.spent ?? 0, currency)}
                </Badge>
                {balanceById.get(detail.id)?.transferIn ? (
                  <Badge tone="positive">
                    In {formatMoney(balanceById.get(detail.id)?.transferIn ?? 0, currency)}
                  </Badge>
                ) : null}
                {balanceById.get(detail.id)?.transferOut ? (
                  <Badge tone="negative">
                    Out {formatMoney(balanceById.get(detail.id)?.transferOut ?? 0, currency)}
                  </Badge>
                ) : null}
              </div>
            </Card>

            <div>
              <SectionTitle title="Activity" />
              {detailActivity.length === 0 ? (
                <p className="text-sm text-foreground/55">No activity on this account yet.</p>
              ) : (
                <div className="space-y-2">
                  {detailActivity.map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{row.label}</p>
                        <p className="text-xs text-foreground/50">{formatDate(row.date)}</p>
                      </div>
                      <span
                        className={
                          "text-sm font-semibold tabular-nums " +
                          (row.tone === "neutral"
                            ? "text-foreground/80"
                            : row.amount >= 0
                              ? "text-positive"
                              : "text-negative")
                        }
                      >
                        {row.amount >= 0 ? "+" : "-"}
                        {formatMoney(Math.abs(row.amount), currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <SectionTitle title="Incomes" />
              {incomes.filter((i) => i.accountId === detail.id).length === 0 ? (
                <p className="text-sm text-foreground/55">No income recorded.</p>
              ) : (
                <Card className="divide-y divide-border p-0">
                  {incomes
                    .filter((i) => i.accountId === detail.id)
                    .map((income) => (
                      <div key={income.id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {income.note?.trim() || "Income"}
                          </p>
                          <p className="text-xs text-foreground/50">{formatDate(income.date)}</p>
                        </div>
                        <span className="text-sm font-semibold text-positive tabular-nums">
                          +{formatMoney(income.amount, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteIncome(income.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-negative hover:bg-negative/10"
                          aria-label="Delete income"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                </Card>
              )}
            </div>

            <div>
              <SectionTitle title="Transfers" />
              {transfers.filter(
                (t) => t.fromAccountId === detail.id || t.toAccountId === detail.id
              ).length === 0 ? (
                <p className="text-sm text-foreground/55">No transfers recorded.</p>
              ) : (
                <Card className="divide-y divide-border p-0">
                  {transfers
                    .filter(
                      (t) => t.fromAccountId === detail.id || t.toAccountId === detail.id
                    )
                    .map((transfer) => {
                      const outgoing = transfer.fromAccountId === detail.id;
                      const other = outgoing
                        ? accountName(transfer.toAccountId)
                        : accountName(transfer.fromAccountId);
                      return (
                        <div
                          key={transfer.id}
                          className="flex items-center gap-3 px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {outgoing ? `To ${other}` : `From ${other}`}
                              {transfer.note?.trim() ? ` · ${transfer.note.trim()}` : ""}
                            </p>
                            <p className="text-xs text-foreground/50">
                              {formatDate(transfer.date)}
                            </p>
                          </div>
                          <span
                            className={
                              "text-sm font-semibold tabular-nums " +
                              (outgoing ? "text-foreground/70" : "text-positive")
                            }
                          >
                            {outgoing ? "−" : "+"}
                            {formatMoney(transfer.amount, currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteTransfer(transfer.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-negative hover:bg-negative/10"
                            aria-label="Delete transfer"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                </Card>
              )}
            </div>

            <Button variant="danger" fullWidth onClick={() => setConfirm(detail)}>
              Delete account
            </Button>
          </div>
        )}
      </Sheet>

      {/* Transfer between accounts */}
      <Sheet
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer"
        footer={
          <Button fullWidth loading={savingTransfer} onClick={saveTransfer}>Transfer</Button>
        }
      >
        <div className="space-y-4">
          <FormField label="From">
            <Select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="To">
            <Select value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Amount">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0"
            />
          </FormField>
          <FormField label="Date">
            <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
          </FormField>
          <FormField label="Note (optional)">
            <Textarea
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="e.g. ATM withdrawal"
            />
          </FormField>
        </div>
      </Sheet>

      {/* Add income */}
      <Sheet
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        title="Add income"
        footer={
          <Button fullWidth loading={savingIncome} onClick={saveIncome}>
            Add income
          </Button>
        }
      >
        <div className="space-y-4">
          <FormField label="Account">
            <Select value={incomeAccountId} onChange={(e) => setIncomeAccountId(e.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Amount">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              placeholder="0"
            />
          </FormField>
          <FormField label="Date">
            <Input type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} />
          </FormField>
          <FormField label="Note (optional)">
            <Textarea
              value={incomeNote}
              onChange={(e) => setIncomeNote(e.target.value)}
              placeholder="e.g. Salary, top-up"
            />
          </FormField>
        </div>
      </Sheet>

      {/* Delete confirm */}
      <Sheet
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title="Delete account?"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth loading={deleting} onClick={removeAccount}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground/70">
          {confirm?.name} and its income records will be removed. Expenses that used it
          stay in your ledger.
        </p>
      </Sheet>
    </div>
  );
}
