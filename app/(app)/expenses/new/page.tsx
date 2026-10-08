"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Spinner } from "@/components/ui";

function NewExpenseInner() {
  const params = useSearchParams();
  const groupId = params.get("groupId") ?? "";
  const kind = params.get("kind") === "shared" || groupId ? "shared" : "personal";
  return <ExpenseForm defaultKind={kind} defaultGroupId={groupId} />;
}

export default function NewExpensePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Add expense" subtitle="Takes less than 30 seconds" back />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6 text-brand" />
          </div>
        }
      >
        <NewExpenseInner />
      </Suspense>
    </div>
  );
}
