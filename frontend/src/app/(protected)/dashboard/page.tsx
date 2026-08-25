"use client";

import { useState } from "react";
import { useStats } from "@/hooks/useStats";
import { useCategories } from "@/context/CategoriesContext";
import { BalanceHero } from "@/components/BalanceHero";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { buildExpensePie } from "@/lib/chartData";

export default function DashboardPage() {
  const { getById } = useCategories();

  // year/month su STATE — filter ih menja, useStats refetch-uje.
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, error } = useStats(year, month);

  // English month name for Hero (e.g. "August 2026")
  const monthLabel = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Pie: samo rashodi
  const pieData = data
    ? buildExpensePie(
        data.byCategory,
        (categoryId) => getById(categoryId)?.type === "expense"
      )
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 sm:p-8">
      {/* Page heading — logout/user su u NavBar-u, ne dupliramo ovde */}
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Overview</h1>
        <p className="text-sm text-ink-muted">Your money at a glance</p>
      </div>

      {/* Filter mesec/godina */}
      <MonthYearPicker
        year={year}
        month={month}
        onYearChange={setYear}
        onMonthChange={setMonth}
      />

      {/* Stats sekcija */}
      {isLoading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : error ? (
        <p className="text-expense">Error: {error}</p>
      ) : !data ? (
        <p className="text-ink-muted">No data.</p>
      ) : (
        <>
          <BalanceHero stats={data} monthLabel={monthLabel} />

          <div className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-bold text-ink">
              Expenses by category
            </h2>
            <CategoryPieChart data={pieData} />
          </div>
        </>
      )}
    </div>
  );
}