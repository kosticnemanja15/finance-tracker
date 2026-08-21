"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatRSD } from "@/lib/format";
import type { PieSlice } from "@/lib/chartData";

type Props = {
  data: PieSlice[];
};

// Brand-derived paleta. Coral/expense familija + komplementarne
// tople boje da kriške budu razlučive ali "iz istog sveta".
const COLORS = [
  "#E8524E", // expense coral
  "#FF5A5F", // brand
  "#F0997B", // coral 200
  "#EF9F27", // amber
  "#D4537E", // pink
  "#0FA47F", // teal (za kontrast na dnu)
  "#B4B2A9", // gray (Ostalo)
];

export function CategoryPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No expenses for this month.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          // label prikazuje ime kriške pored nje
          label={(entry) => entry.name}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatRSD(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}