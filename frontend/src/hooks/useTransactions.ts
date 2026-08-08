'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import type { Transaction, Pagination } from '@/types';

// params koje backend prihvata na GET /transactions
// prazno za sad — korak 4 (filteri) samo popunjava polja
export interface TransactionFilters {
  type?: 'income' | 'expense';
  categoryId?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface TransactionsResponse {
  data: Transaction[];
  pagination: Pagination;
}

// gradi ?type=...&categoryId=... preskačući prazne vrednosti
function buildQuery(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useTransactions(filters: TransactionFilters = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KLJUČNO: filters je objekat → nova referenca na svaki render.
  // Serijalizujemo u string da useEffect dep bude stabilan kad su vrednosti iste.
  const query = buildQuery(filters);

  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<TransactionsResponse>(`/transactions${query}`);
      if (!signal?.cancelled) {
        setTransactions(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      if (!signal?.cancelled) {
        setError(err instanceof ApiError ? err.message : 'Failed to load transactions');
      }
    } finally {
      if (!signal?.cancelled) setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const signal = { cancelled: false };
    load(signal);
    return () => { signal.cancelled = true; };
  }, [load]);

  // ručni refetch (bez cancel guard-a) — za posle create/delete
  const refetch = useCallback(() => load(), [load]);

  return { transactions, pagination, isLoading, error, refetch };
}