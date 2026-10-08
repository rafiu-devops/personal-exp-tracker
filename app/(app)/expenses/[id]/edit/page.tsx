"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { EmptyState, Spinner } from "@/components/ui";
import { useData } from "@/lib/data-context";

export default function EditExpensePage() {
  const params = useParams<{ id: string }>();
  const { expenses, loading } = useData();
  const expense = expenses.find((e) => e.id === params.id);

  return (
    <div className="space-y-4">
      <PageHeader title="Edit expense" back={`/expenses/${params.id}`} />
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
