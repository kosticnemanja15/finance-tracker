import { useState, useEffect, useCallback } from "react";
import { apiFetch, ApiError } from "@/lib/api";

export type CategoryStat = {
  categoryId: number;
  categoryName: string;
  total: number;
};

export type Stats = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: CategoryStat[];
};

export function useStats(year: number, month: number) {
  const [data, setData] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Isti pattern kao useTransactions: useCallback + signal objekat.
  // year/month u dependency array-u → nova load funkcija kad se promene.
  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
      });
      const res = await apiFetch<Stats>(`/transactions/stats?${params}`);
      if (!signal?.cancelled) {
        setData(res);
      }
    } catch (err) {
      if (!signal?.cancelled) {
        setError(err instanceof ApiError ? err.message : "Failed to load stats");
      }
    } finally {
      if (!signal?.cancelled) setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    const signal = { cancelled: false };
    load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  return { data, isLoading, error, refetch: load };
}