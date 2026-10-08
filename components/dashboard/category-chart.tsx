"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/format";

export interface ChartDatum {
  name: string;
  value: number;
  color: string;
}

export function CategoryChart({ data }: { data: ChartDatum[] }) {
  if (data.length === 0) return null;
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="flex items-center gap-4">
      <div className="h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={66}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatMoney(Number(value))}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: 12,
                color: "var(--foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.slice(0, 6).map((entry) => (
          <li key={entry.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
            <span className="min-w-0 flex-1 truncate text-foreground/70">{entry.name}</span>
            <span className="font-medium tabular-nums">{formatMoney(entry.value)}</span>
            <span className="w-10 text-right text-xs text-foreground/40 tabular-nums">
              {total ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
