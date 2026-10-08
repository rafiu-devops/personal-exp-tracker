"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";

export function TrendChart({ data }: { data: Array<{ month: string; total: number }> }) {
  const chartData = data.map((d) => ({
    label: d.month.slice(5),
    total: d.total,
  }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.5 }}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-muted)" }}
            formatter={(value) => [formatMoney(Number(value)), "Spent"] as [string, string]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: 12,
              color: "var(--foreground)",
            }}
          />
          <Bar dataKey="total" fill="var(--brand)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
