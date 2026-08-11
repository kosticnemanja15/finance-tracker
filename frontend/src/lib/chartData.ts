import type { CategoryStat } from "@/hooks/useStats";

export type PieSlice = {
  name: string;
  value: number;
};

// Uzmi byCategory, zadrži samo rashode, sortiraj, grupiši rep u "Ostalo".
// isExpense: funkcija koja za categoryId kaže da li je rashod
// (dolazi iz CategoriesContext preko getById).
export function buildExpensePie(
  byCategory: CategoryStat[],
  isExpense: (categoryId: number) => boolean,
  topN = 6
): PieSlice[] {
  // 1. Samo rashodi
  const expenses = byCategory
    .filter((c) => isExpense(c.categoryId))
    .map((c) => ({ name: c.categoryName, value: c.total }))
    .sort((a, b) => b.value - a.value); // najveći prvi

  // 2. Ako ima <= topN, vrati sve
  if (expenses.length <= topN) return expenses;

  // 3. Inače: top N + "Ostalo" (zbir repa)
  const top = expenses.slice(0, topN);
  const restTotal = expenses
    .slice(topN)
    .reduce((sum, c) => sum + c.value, 0);

  return [...top, { name: "Ostalo", value: restTotal }];
}