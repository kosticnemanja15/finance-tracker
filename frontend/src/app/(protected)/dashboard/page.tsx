"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useStats } from "@/hooks/useStats";
import { useCategories } from "@/context/CategoriesContext";
import { BalanceHero } from "@/components/BalanceHero";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { buildExpensePie } from "@/lib/chartData";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { getById } = useCategories();

  // year/month su sad STATE (ne konstante) — filter ih menja, useStats refetch-uje.
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, error } = useStats(year, month);

  // Srpski naziv meseca za Hero (npr. "avgust 2026")
  const monthLabel = new Date(year, month - 1).toLocaleDateString("sr-Latn", {
    month: "long",
    year: "numeric",
  });

  // Priprema pie podataka: samo rashodi (tip iz CategoriesContext)
  const pieData = data
    ? buildExpensePie(
        data.byCategory,
        (categoryId) => getById(categoryId)?.type === "expense"
      )
    : [];

  return (
    <div className="min-h-screen p-6 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header: welcome + logout */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl">Overview</h1>
            <p className="text-sm text-muted-foreground">
              {user?.name} ({user?.role})
            </p>
          </div>
          <Button onClick={logout} variant="outline">
            Log out
          </Button>
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
          <p className="text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-expense">Error: {error}</p>
        ) : !data ? (
          <p className="text-muted-foreground">No data.</p>
        ) : (
          <>
            <BalanceHero stats={data} monthLabel={monthLabel} />

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg mb-4">Expenses by category</h2>
              <CategoryPieChart data={pieData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}