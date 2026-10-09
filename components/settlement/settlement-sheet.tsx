"use client";

import { useEffect, useState } from "react";
import { Button, FormField, Input, Label, Select, Sheet, Textarea } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/toast";
import { friendlyError } from "@/lib/errors";
import { todayISO } from "@/lib/format";
import { SELF_ID } from "@/lib/types";

export interface SettlementPreset {
  personId: string;
  direction: "theyOwe" | "iOwe";
  amount?: number;
}

export function SettlementSheet({
  open,
  onClose,
  preset,
  groupId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  preset?: SettlementPreset;
  groupId?: string;
  onSaved?: () => void;
}) {
  const { profile } = useAuth();
  const { people, accounts, addSettlement, resolveName } = useData();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [fromPersonId, setFromPersonId] = useState(SELF_ID);
  const [toPersonId, setToPersonId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState("");

  const selfName = profile?.name ?? "You";
  const touchesSelf = fromPersonId === SELF_ID || toPersonId === SELF_ID;

  useEffect(() => {
    if (!open) return;
    if (preset) {
      if (preset.direction === "theyOwe") {
        setFromPersonId(preset.personId);
        setToPersonId(SELF_ID);
      } else {
        setFromPersonId(SELF_ID);
        setToPersonId(preset.personId);
      }
      setAmount(preset.amount ? String(preset.amount) : "");
    } else {
      setFromPersonId(SELF_ID);
      setToPersonId(people[0]?.id ?? "");
      setAmount("");
    }
    setDate(todayISO());
    setNote("");
    setAccountId(accounts[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset, people]);

  const save = async () => {
    const value = Math.round(Number(amount));
    if (!fromPersonId || !toPersonId || fromPersonId === toPersonId) {
      toast("Choose two different people", "error");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast("Enter an amount greater than 0", "error");
      return;
    }
    setSaving(true);
    try {
      await addSettlement({
        fromPersonId,
        toPersonId,
        amount: value,
        date,
        note,
        accountId: touchesSelf ? accountId : "",
        groupId: groupId ?? "",
      });
      toast("Settlement recorded", "success");
      onSaved?.();
      onClose();
    } catch (error) {
      toast(friendlyError(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Record a settlement"
      footer={
        <Button fullWidth onClick={save} loading={saving}>
          Save settlement
        </Button>
      }
    >
      <div className="space-y-4">
        {preset ? (
          <div className="rounded-2xl bg-surface-muted p-3 text-sm">
            {preset.direction === "theyOwe" ? (
              <p>
                <strong>{resolveName(preset.personId)}</strong> pays <strong>{selfName}</strong>
              </p>
            ) : (
              <p>
                <strong>{selfName}</strong> pays <strong>{resolveName(preset.personId)}</strong>
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Paid by</Label>
              <Select value={fromPersonId} onChange={(e) => setFromPersonId(e.target.value)}>
                <option value={SELF_ID}>{selfName}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Paid to</Label>
              <Select value={toPersonId} onChange={(e) => setToPersonId(e.target.value)}>
                <option value="">Select…</option>
                <option value={SELF_ID}>{selfName}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        <FormField label="Amount">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-foreground/40">
              Rs
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="pl-11"
            />
          </div>
        </FormField>

        <FormField label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>

        {touchesSelf && accounts.length > 0 && (
          <FormField
            label={fromPersonId === SELF_ID ? "Paid from account" : "Received into account"}
          >
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <FormField label="Note (optional)">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid back in cash"
          />
        </FormField>
      </div>
    </Sheet>
  );
}
