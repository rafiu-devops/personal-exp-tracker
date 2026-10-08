"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  MoneyText,
  SectionTitle,
  Sheet,
} from "@/components/ui";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { SettlementSheet, type SettlementPreset } from "@/components/settlement/settlement-sheet";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/toast";
import { friendlyError } from "@/lib/errors";
import { computeSelfLedger } from "@/lib/balances";
import { formatDate, formatMoney } from "@/lib/format";
import { SELF_ID } from "@/lib/types";

export default function PeoplePage() {
  const {
    people,
    expenses,
    settlements,
    addPerson,
    updatePerson,
    deletePerson,
    resolveName,
  } = useData();
  const { toast } = useToast();
  const ledger = useMemo(() => computeSelfLedger(expenses, settlements), [expenses, settlements]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [preset, setPreset] = useState<SettlementPreset | null>(null);

  const person = people.find((p) => p.id === detailId) ?? null;
  const confirmPerson = people.find((p) => p.id === confirmId) ?? null;

  const personTx = useMemo(() => {
    if (!detailId) return [];
    const es = expenses
      .filter(
        (e) =>
          e.kind === "shared" &&
          (e.payerId === detailId || e.participantIds.includes(detailId))
      )
      .map((e) => ({ type: "expense" as const, date: e.date, expense: e }));
    const ss = settlements
      .filter((s) => s.fromPersonId === detailId || s.toPersonId === detailId)
      .map((s) => ({ type: "settlement" as const, date: s.date, settlement: s }));
    return [...es, ...ss].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [detailId, expenses, settlements]);

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setPhone("");
    setEmail("");
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    const p = people.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setName(p.name);
    setPhone(p.phone ?? "");
    setEmail(p.email ?? "");
    setFormOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast("Enter a name", "error");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updatePerson(editingId, { name, phone, email });
        toast("Person updated", "success");
      } else {
        await addPerson({ name, phone, email });
        toast("Person added", "success");
      }
      setFormOpen(false);
    } catch (error) {
      toast(friendlyError(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await deletePerson(confirmId);
      toast("Person removed", "success");
      setConfirmId(null);
      setDetailId(null);
    } catch {
      toast("Could not remove the person", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="People"
        subtitle={`${people.length} contact${people.length === 1 ? "" : "s"}`}
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand"
            aria-label="Add person"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        }
      />

      {people.length === 0 ? (
        <EmptyState
          icon="🙋"
          title="No people yet"
          description="Add the friends you split expenses with. You can track who owes whom."
          action={
            <Button onClick={openAdd}>Add a person</Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {people.map((p) => {
            const net = ledger.get(p.id) ?? 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setDetailId(p.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 text-left transition hover:bg-surface-muted"
              >
                <Avatar name={p.name} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-foreground/50">
                    {p.phone || p.email || (net === 0 ? "Settled up" : "Shared expenses")}
                  </p>
                </div>
                {net !== 0 && (
                  <div className="text-right">
                    <MoneyText amount={Math.abs(net)} className="font-semibold" />
                    <p className="text-[11px] text-foreground/45">
                      {net > 0 ? "owes you" : "you owe"}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Add / edit person */}
      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Edit person" : "Add person"}
        footer={
          <Button fullWidth loading={saving} onClick={save}>
            {editingId ? "Save changes" : "Add person"}
          </Button>
        }
      >
        <div className="space-y-4">
          <FormField label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Ali" />
          </FormField>
          <FormField label="Phone (optional)">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="+92 300 1234567"
            />
          </FormField>
          <FormField label="Email (optional)">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ali@example.com"
            />
          </FormField>
        </div>
      </Sheet>

      {/* Person detail */}
      <Sheet
        open={person !== null}
        onClose={() => setDetailId(null)}
        title={person?.name ?? ""}
      >
        {person && (
          <div className="space-y-4">
            <Card className="text-center">
              <p className="text-sm text-foreground/50">Balance</p>
              {(() => {
                const net = ledger.get(person.id) ?? 0;
                return (
                  <>
                    <p
                      className={
                        "mt-1 text-2xl font-bold tabular-nums " +
                        (net > 0 ? "text-positive" : net < 0 ? "text-negative" : "")
                      }
                    >
                      {net === 0 ? "Settled up" : formatMoney(Math.abs(net))}
                    </p>
                    {net !== 0 && (
                      <p className="mt-0.5 text-xs text-foreground/50">
                        {net > 0 ? `${person.name} owes you` : `You owe ${person.name}`}
                      </p>
                    )}
                  </>
                );
              })()}
              <div className="mt-3 flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="soft"
                  onClick={() =>
                    setPreset({
                      personId: person.id,
                      direction: (ledger.get(person.id) ?? 0) >= 0 ? "theyOwe" : "iOwe",
                      amount: Math.abs(ledger.get(person.id) ?? 0) || undefined,
                    })
                  }
                >
                  Settle up
                </Button>
                <Button size="sm" variant="secondary" onClick={() => openEdit(person.id)}>
                  <EditIcon className="h-4 w-4" /> Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmId(person.id)}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            <div>
              <SectionTitle title="History" />
              {personTx.length === 0 ? (
                <p className="text-sm text-foreground/55">No transactions together yet.</p>
              ) : (
                <div className="space-y-2">
                  {personTx.map((tx) =>
                    tx.type === "expense" ? (
                      <div
                        key={`e-${tx.expense.id}`}
                        className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-2"
                      >
                        <span className="text-lg">🧾</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{tx.expense.title}</p>
                          <p className="text-xs text-foreground/50">
                            {tx.expense.payerId === SELF_ID
                              ? `You paid · ${formatDate(tx.expense.date)}`
                              : `${resolveName(tx.expense.payerId)} paid · ${formatDate(tx.expense.date)}`}
                          </p>
                        </div>
                        <MoneyText amount={tx.expense.amount} className="text-sm font-medium" />
                      </div>
                    ) : (
                      <div
                        key={`s-${tx.settlement.id}`}
                        className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-2"
                      >
                        <span className="text-lg">✅</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {tx.settlement.fromPersonId === SELF_ID
                              ? `You paid ${person.name}`
                              : `${person.name} paid you`}
                          </p>
                          <p className="text-xs text-foreground/50">{formatDate(tx.settlement.date)}</p>
                        </div>
                        <MoneyText amount={tx.settlement.amount} className="text-sm font-medium" />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Sheet>

      <Sheet
        open={confirmPerson !== null}
        onClose={() => setConfirmId(null)}
        title="Remove person?"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth loading={deleting} onClick={remove}>
              Remove
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground/70">
          {confirmPerson?.name} will be removed from your contacts. Past expenses and
          balances stay intact.
        </p>
      </Sheet>

      <SettlementSheet
        open={preset !== null}
        onClose={() => setPreset(null)}
        preset={preset ?? undefined}
      />
    </div>
  );
}
