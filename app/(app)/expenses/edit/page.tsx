"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { EmptyState, Spinner } from "@/components/ui";
import { useData } from "@/lib/data-context";

function EditExpenseInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const { expenses, loading } = useData();
  const expense = expenses.find((e) => e.id === id);

  return (
    <div className="space-y-4">
      <PageHeader title="Edit expense" back={`/expenses/detail?id=${id}`} />
      {expense ? (
        <ExpenseForm initial={expense} />
      ) : (
        <div className="py-16">
          {loading ? (
            <div className="flex justify-center">
              <Spinner className="h-6 w-6 text-brand" />
            </div>
          ) : (
            <EmptyState
              icon="🤔"
              title="Expense not found"
              action={
                <Link href="/expenses" className="font-semibold text-brand">
                  Back to expenses
                </Link>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function EditExpensePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand" />
        </div>
      }
    >
      <EditExpenseInner />
    </Suspense>
  );
}
