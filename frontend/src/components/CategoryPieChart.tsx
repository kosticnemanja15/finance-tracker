"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/format";
import type { PieSlice } from "@/lib/chartData";

type Props = {
  data: PieSlice[];
};

const SLICE_COLORS = [
  "#FF5A5F", // coral / housing
  "#F2955A", // orange / food
  "#E8B04B", // gold / subscriptions
  "#A472C6", // plum / transport
  "#E0699A", // rose / shopping
  "#9B7FA8", // mauve / other-category
  "#8C8598", // muted — "Other" aggregate bucket
];

// Custom tooltip. % računamo iz total-a (Recharts `percent` je nepouzdan
// na custom content — vraća undefined → 0%). value uzimamo iz payload-a.
function makeTooltip(total: number) {
  return function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const slice = payload[0];
    const value = Number(slice.value);
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div className="rounded-btn border border-line bg-surface px-3 py-2 text-ink shadow-card">
        <div className="text-sm font-semibold">{slice.name}</div>
        <div className="text-sm tabular-nums text-ink-muted">
          {formatMoney(value)} · {pct}%
        </div>
      </div>
    );
  };
}

export function CategoryPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        No expenses for this month.
      </p>
    );
  }

  const total = data.reduce((sum, s) => sum + s.value, 0);
  const ChartTooltip = makeTooltip(total);

  return (
    <div>
      {/* Donut + total u centru */}
      <div className="relative" style={{ height: 220 }}>
        {/* Center overlay — z-0 + pointer-events-none: ispod tooltip-a, ne jede ga */}
        <div className="pointer-events-none absolute inset-0 z-0 grid place-content-center text-center">
          <div className="text-xs text-ink-subtle">Spent</div>
          <div className="font-display text-lg font-bold tabular-nums text-ink">
            {formatMoney(total)}
          </div>
        </div>

        {/* SVG iznad centra (z-10) → tooltip se crta preko total-a */}
        <div className="relative z-10 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={95}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Custom legenda */}
      <ul className="mt-5">
        {data.map((slice, index) => {
          const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          return (
            <li
              key={index}
              className="flex items-center gap-2.5 border-b border-line py-2 text-sm last:border-0"
            >
              <span
                className="h-2.5 w-2.5 flex-none rounded-[3px]"
                style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
              />
              <span className="flex-1 text-ink">{slice.name}</span>
              <span className="font-bold tabular-nums text-ink">
                {formatMoney(slice.value)}
              </span>
              <span className="w-11 text-right tabular-nums text-ink-subtle">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}