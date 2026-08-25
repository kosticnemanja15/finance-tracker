import type { CategoryStat } from "@/hooks/useStats";

export type PieSlice = {
  name: string;
  value: number;
};

// Uzmi byCategory, zadrži samo rashode, sortiraj, grupiši rep u "Other".
export function buildExpensePie(
  byCategory: CategoryStat[],
  isExpense: (categoryId: number) => boolean,
  topN = 6
): PieSlice[] {
  const expenses = byCategory
    .filter((c) => isExpense(c.categoryId))
    .map((c) => ({ name: c.categoryName, value: c.total }))
    .sort((a, b) => b.value - a.value);

  if (expenses.length <= topN) return expenses;

  const top = expenses.slice(0, topN);
  const restTotal = expenses.slice(topN).reduce((sum, c) => sum + c.value, 0);

  return [...top, { name: "Other", value: restTotal }];
}