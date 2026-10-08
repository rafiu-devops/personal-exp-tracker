"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState, MoneyText } from "@/components/ui";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { useData } from "@/lib/data-context";
import { computeGroupBalances } from "@/lib/balances";
import { formatMoney } from "@/lib/format";

export default function GroupsPage() {
  const { groups, expenses, settlements } = useData();

  const rows = useMemo(
    () =>
      groups
        .filter((g) => !g.archived)
        .map((group) => {
          const groupExpenses = expenses.filter((e) => e.groupId === group.id);
          const total = groupExpenses.reduce((acc, e) => acc + e.amount, 0);
          const balance = computeGroupBalances(expenses, settlements, group.id);
          return { group, total, count: groupExpenses.length, balance };
        }),
    [groups, expenses, settlements]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Groups"
        subtitle={`${groups.length} group${groups.length === 1 ? "" : "s"}`}
        actions={
          <Link
            href="/groups/new"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand"
            aria-label="New group"
          >
            <PlusIcon className="h-5 w-5" />
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No groups yet"
          description="Create a group like Friends, Office Team or a trip to split shared expenses."
          action={
            <Link
              href="/groups/new"
              className="inline-flex h-11 items-center rounded-2xl bg-brand px-5 text-sm font-semibold text-brand-foreground"
            >
              Create a group
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map(({ group, total, count, balance }) => (
            <Link key={group.id} href={`/groups/${group.id}`} className="block">
              <Card className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-xl">
                  👥
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{group.name}</p>
                  <p className="truncate text-xs text-foreground/50">
                    {group.memberIds.length} member
                    {group.memberIds.length === 1 ? "" : "s"} · {count} expense
                    {count === 1 ? "" : "s"} · {formatMoney(total)}
                  </p>
                  {balance.net !== 0 && (
                    <p className="mt-0.5 text-xs">
                      <span className="text-foreground/50">
                        {balance.net > 0 ? "You are owed " : "You owe "}
                      </span>
                      <MoneyText amount={Math.abs(balance.net)} className="text-xs font-semibold" />
                    </p>
                  )}
                </div>
                <ChevronRightIcon className="h-5 w-5 text-foreground/30" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
