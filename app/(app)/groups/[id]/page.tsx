"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  FormField,
  Input,
  MoneyText,
  SectionTitle,
  Sheet,
  Spinner,
  Textarea,
} from "@/components/ui";
import { EditIcon, PlusIcon } from "@/components/icons";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { SettlementSheet, type SettlementPreset } from "@/components/settlement/settlement-sheet";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/toast";
import { computeGroupBalances } from "@/lib/balances";
import { formatDate, formatMoney } from "@/lib/format";

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    groups,
    expenses,
    settlements,
    people,
    resolveName,
    updateGroup,
    deleteGroup,
    loading,
  } = useData();
  const { toast } = useToast();

  const group = groups.find((g) => g.id === params.id);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preset, setPreset] = useState<SettlementPreset | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description ?? "");
      setMemberIds(group.memberIds);
    }
  }, [group]);

  const groupExpenses = useMemo(
    () => expenses.filter((e) => e.groupId === params.id),
    [expenses, params.id]
  );
  const groupSettlements = useMemo(
    () => settlements.filter((s) => s.groupId === params.id),
    [settlements, params.id]
  );
  const balance = useMemo(
    () => computeGroupBalances(expenses, settlements, params.id),
    [expenses, settlements, params.id]
  );
  const totalSpend = groupExpenses.reduce((acc, e) => acc + e.amount, 0);

  if (!group) {
    return (
      <div>
        <PageHeader title="Group" back="/groups" />
        <div className="py-16">
          {loading ? (
            <div className="flex justify-center">
              <Spinner className="h-6 w-6 text-brand" />
            </div>
          ) : (
            <EmptyState icon="🤔" title="Group not found" />
          )}
        </div>
      </div>
    );
  }

  const save = async () => {
    if (!name.trim()) {
      toast("Enter a group name", "error");
      return;
    }
    setSaving(true);
    try {
      await updateGroup(group.id, { name: name.trim(), description, memberIds });
      toast("Group updated", "success");
      setEditOpen(false);
    } catch {
      toast("Could not update the group", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteGroup(group.id);
      toast("Group deleted", "success");
      router.push("/groups");
    } catch {
      toast("Could not delete the group", "error");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={group.name}
        subtitle={group.description || `${groupExpenses.length} expenses`}
        back="/groups"
        actions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-surface-muted"
              aria-label="Edit group"
            >
              <EditIcon className="h-5 w-5" />
            </button>
            <Link
              href={`/expenses/new?kind=shared&groupId=${group.id}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand"
              aria-label="Add group expense"
            >
              <PlusIcon className="h-5 w-5" />
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xs text-foreground/50">Total</p>
          <p className="mt-1 text-sm font-bold tabular-nums">{formatMoney(totalSpend)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-foreground/50">You owe</p>
          <p className="mt-1 text-sm font-bold text-negative tabular-nums">
            {formatMoney(balance.youOwe)}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-foreground/50">Owed to you</p>
          <p className="mt-1 text-sm font-bold text-positive tabular-nums">
            {formatMoney(balance.youAreOwed)}
          </p>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Members" />
        {group.memberIds.length === 0 ? (
          <p className="text-sm text-foreground/55">No members yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {group.memberIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-sm"
              >
                <Avatar name={resolveName(id)} size={20} />
                {resolveName(id)}
              </span>
            ))}
          </div>
        )}
      </Card>

      {balance.byPerson.length > 0 && (
        <div>
          <SectionTitle title="Group balances" />
          <Card className="divide-y divide-border p-0">
            {balance.byPerson.map((b) => (
              <div key={b.personId} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={resolveName(b.personId)} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{resolveName(b.personId)}</p>
                  <p className="text-xs text-foreground/50">
                    {b.net > 0 ? "owes you" : "you owe"}
                  </p>
                </div>
                <MoneyText amount={Math.abs(b.net)} className="font-semibold" />
                <Button
                  size="sm"
                  variant="soft"
                  onClick={() =>
                    setPreset({
                      personId: b.personId,
                      direction: b.net > 0 ? "theyOwe" : "iOwe",
                      amount: Math.abs(b.net),
                    })
                  }
                >
                  Settle
                </Button>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <SectionTitle title="Expense history" className="mb-0" />
          <Link
            href={`/expenses/new?kind=shared&groupId=${group.id}`}
            className="text-xs font-semibold text-brand"
          >
            Add expense
          </Link>
        </div>
        {groupExpenses.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="No group expenses"
            description="Add the first shared expense for this group."
            action={
              <Link
                href={`/expenses/new?kind=shared&groupId=${group.id}`}
                className="inline-flex h-11 items-center rounded-2xl bg-brand px-5 text-sm font-semibold text-brand-foreground"
              >
                Add expense
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {groupExpenses.map((expense) => (
              <ExpenseItem key={expense.id} expense={expense} />
            ))}
          </div>
        )}
      </div>

      {groupSettlements.length > 0 && (
        <div>
          <SectionTitle title="Settlements" />
          <Card className="divide-y divide-border p-0">
            {groupSettlements.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="text-lg">✅</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    {resolveName(s.fromPersonId)} paid {resolveName(s.toPersonId)}
                  </p>
                  <p className="text-xs text-foreground/50">{formatDate(s.date)}</p>
                </div>
                <MoneyText amount={s.amount} className="font-medium" />
              </div>
            ))}
          </Card>
        </div>
      )}

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{group.archived ? "Archived" : "Active group"}</p>
          <p className="text-xs text-foreground/50">
            {group.archived ? "Hidden from the main list" : "Shown in your groups list"}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateGroup(group.id, { archived: !group.archived })}
        >
          {group.archived ? "Unarchive" : "Archive"}
        </Button>
      </Card>

      <Button variant="danger" fullWidth onClick={() => setConfirmOpen(true)}>
        Delete group
      </Button>

      {/* Edit sheet */}
      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit group"
        footer={
          <Button fullWidth loading={saving} onClick={save}>
            Save changes
          </Button>
        }
      >
        <div className="space-y-4">
          <FormField label="Group name">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
          </FormField>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground/70">Members</p>
            <div className="flex flex-wrap gap-2">
              {people.map((person) => (
                <Chip
                  key={person.id}
                  active={memberIds.includes(person.id)}
                  onClick={() =>
                    setMemberIds((prev) =>
                      prev.includes(person.id)
                        ? prev.filter((m) => m !== person.id)
                        : [...prev, person.id]
                    )
                  }
                >
                  {person.name}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete group?"
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
          The group is removed. Its past expenses stay in your ledger so your totals
          remain accurate.
        </p>
      </Sheet>

      <SettlementSheet
        open={preset !== null}
        onClose={() => setPreset(null)}
        preset={preset ?? undefined}
        groupId={group.id}
      />
    </div>
  );
}
