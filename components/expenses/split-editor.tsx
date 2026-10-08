"use client";

import { Avatar, Chip, Input, SegmentedControl } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { computeShares, validateSplit } from "@/lib/split";
import { SELF_ID, type Person, type SplitEntry, type SplitType } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface SplitValue {
  payerId: string;
  participantIds: string[];
  splitType: SplitType;
  entries: SplitEntry[];
}

export function SplitEditor({
  amount,
  people,
  selfName,
  value,
  onChange,
}: {
  amount: number;
  people: Person[];
  selfName: string;
  value: SplitValue;
  onChange: (next: Partial<SplitValue>) => void;
}) {
  const { payerId, participantIds, splitType, entries } = value;

  const nameOf = (id: string) =>
    id === SELF_ID ? selfName : people.find((p) => p.id === id)?.name ?? "Unknown";

  const toggleParticipant = (id: string) => {
    const next = participantIds.includes(id)
      ? participantIds.filter((p) => p !== id)
      : [...participantIds, id];
    const nextEntries = next.map((pid) => {
      const existing = entries.find((e) => e.personId === pid);
      if (existing) return existing;
      const equalPct = next.length ? Math.round((10000 / next.length)) / 100 : 0;
      return { personId: pid, value: splitType === "percentage" ? equalPct : 0 };
    });
    const nextPayer = next.includes(payerId) ? payerId : next[0] ?? SELF_ID;
    onChange({ participantIds: next, entries: nextEntries, payerId: nextPayer });
  };

  const changeSplitType = (next: SplitType) => {
    const nextEntries = participantIds.map((pid) => {
      const existing = entries.find((e) => e.personId === pid);
      if (next === "percentage") {
        const equalPct = participantIds.length
          ? Math.round((10000 / participantIds.length)) / 100
          : 0;
        return { personId: pid, value: existing?.value && next === splitType ? existing.value : equalPct };
      }
      return { personId: pid, value: existing?.value ?? 0 };
    });
    onChange({ splitType: next, entries: nextEntries });
  };

  const updateEntry = (personId: string, raw: string) => {
    const numeric = raw === "" ? 0 : Number(raw);
    const nextEntries = participantIds.map((pid) =>
      pid === personId
        ? { personId: pid, value: Number.isFinite(numeric) ? numeric : 0 }
        : entries.find((e) => e.personId === pid) ?? { personId: pid, value: 0 }
    );
    onChange({ entries: nextEntries });
  };

  const roundedAmount = Math.round(amount || 0);
  const validation = validateSplit(roundedAmount, splitType, participantIds, entries);
  const shares = validation.valid
    ? computeShares(roundedAmount, splitType, participantIds, entries)
    : [];

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground/70">Participants</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={participantIds.includes(SELF_ID)} onClick={() => toggleParticipant(SELF_ID)}>
            <Avatar name={selfName} size={20} /> You
          </Chip>
          {people.map((person) => (
            <Chip
              key={person.id}
              active={participantIds.includes(person.id)}
              onClick={() => toggleParticipant(person.id)}
            >
              {person.name}
            </Chip>
          ))}
          {people.length === 0 && (
            <p className="text-sm text-foreground/45">
              No people yet — add friends from the People tab to split with them.
            </p>
          )}
        </div>
      </div>

      {participantIds.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground/70">Who paid?</p>
          <div className="flex flex-wrap gap-2">
            {participantIds.map((pid) => (
              <Chip
                key={pid}
                active={payerId === pid}
                onClick={() => onChange({ payerId: pid })}
              >
                {nameOf(pid)}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {participantIds.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground/70">Split method</p>
          <SegmentedControl
            value={splitType}
            onChange={changeSplitType}
            options={[
              { value: "equal", label: "Equally" },
              { value: "exact", label: "Exact" },
              { value: "percentage", label: "%" },
            ]}
          />
        </div>
      )}

      {splitType !== "equal" && participantIds.length > 0 && (
        <div className="space-y-2">
          {participantIds.map((pid) => {
            const entry = entries.find((e) => e.personId === pid);
            return (
              <div key={pid} className="flex items-center gap-3">
                <span className="flex-1 truncate text-sm text-foreground/80">{nameOf(pid)}</span>
                <div className="relative w-28">
                  <Input
                    inputMode="decimal"
                    type="number"
                    min={0}
                    step={splitType === "percentage" ? 0.01 : 1}
                    value={entry?.value ?? 0}
                    onChange={(e) => updateEntry(pid, e.target.value)}
                    className="pr-8 text-right"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground/40">
                    {splitType === "percentage" ? "%" : "Rs"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {participantIds.length > 0 && (
        <div
          className={cn(
            "rounded-2xl p-3 text-sm",
            validation.valid ? "bg-positive/10" : "bg-negative/10"
          )}
        >
          {validation.valid ? (
            <>
              <p className="mb-2 font-semibold text-positive">Split preview</p>
              <ul className="space-y-1">
                {shares.map((share) => (
                  <li key={share.personId} className="flex justify-between text-foreground/75">
                    <span>{nameOf(share.personId)}</span>
                    <span className="tabular-nums">{formatMoney(share.owedAmount)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ul className="space-y-1 text-negative">
              {validation.errors.map((err) => (
                <li key={err}>• {err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
