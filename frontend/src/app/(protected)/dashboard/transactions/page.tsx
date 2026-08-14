'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/context/CategoriesContext';
import type { Transaction } from '@/types';

function formatAmount(t: Transaction) {
  const sign = t.type === 'income' ? '+' : '-';
  const className = t.type === 'income' ? 'text-green-600' : 'text-red-600';
  const formatted = t.amount.toLocaleString('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return { text: `${sign}${formatted}`, className };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sr-RS', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// prazan string = filter nije postavljen; buildQuery ga preskače
const EMPTY_FILTERS = { type: '', categoryId: '', from: '', to: '' };

export default function TransactionsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const { categories, getById } = useCategories();

  // string state → tipiran filters objekat (mapiranje na jednom mestu)
    const { transactions, pagination, isLoading, error } = useTransactions({
    type: filters.type ? (filters.type as 'income' | 'expense') : undefined,
    categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    page,                // ← novo
    limit: 5,            // ← mali limit da lakše testiraš pagination
    });

  // kategorije u dropdown-u prate izabrani tip (income filter → samo income kategorije)
  const categoryOptions = filters.type
    ? categories.filter((c) => c.type === filters.type)
    : categories;

  const hasActiveFilters =
    filters.type || filters.categoryId || filters.from || filters.to;

  // promena tipa resetuje kategoriju (opcije se menjaju, stara može biti nevalidna)
function handleTypeChange(value: string) {
  setFilters((f) => ({ ...f, type: value, categoryId: '' }));
  setPage(1); // reset na prvu stranu kad se filter promeni
}

  function handleChange(key: keyof typeof filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <Link
            href="/dashboard/transactions/new"
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-black/80"
          >
            + New
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col flex-wrap items-stretch gap-3 rounded border p-4 sm:flex-row sm:items-end">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">Tip</label>
            <select
              value={filters.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="rounded border px-3 py-1.5 text-sm"
            >
              <option value="">Sve</option>
              <option value="income">Prihod</option>
              <option value="expense">Rashod</option>
            </select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">Kategorija</label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className="rounded border px-3 py-1.5 text-sm"
            >
              <option value="">Sve</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">Od</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleChange('from', e.target.value)}
              className="rounded border px-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Do</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleChange('to', e.target.value)}
              className="rounded border px-3 py-1.5 text-sm"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }}
              className="rounded border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Očisti
            </button>
          )}
        </div>

        {/* Lista */}
        {isLoading && <p className="text-muted-foreground">Loading...</p>}

        {!isLoading && error && <p className="text-red-600">Greška: {error}</p>}

        {!isLoading && !error && transactions.length === 0 && (
          <div className="rounded border border-dashed p-8 text-center text-muted-foreground">
            {hasActiveFilters
              ? 'Nema transakcija za izabrane filtere.'
              : 'Nemate transakcije. Dodajte prvu.'}
          </div>
        )}

        {!isLoading && !error && transactions.length > 0 && (
          <ul className="divide-y rounded border">
            {transactions.map((t) => {
              const category = getById(t.categoryId);
              const amount = formatAmount(t);
              return (
                <li key={t.id}>
                  <Link
                    href={`/dashboard/transactions/${t.id}`}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category?.icon ?? '❓'}</span>
                      <div>
                        <p className="font-medium">
                          {category?.name ?? 'Nepoznata kategorija'}
                        </p>
                        <p className="text-sm text-muted-foreground">{t.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${amount.className}`}>{amount.text}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(t.date)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
{/* Pagination — prikaži samo ako ima podataka */}
{!isLoading && !error && transactions.length > 0 && pagination && (
  <div className="flex items-center justify-between pt-2">
    <button
      onClick={() => setPage((p) => p - 1)}
      disabled={page <= 1}
      className="rounded border px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
    >
      ‹ Prethodna
    </button>

    <span className="text-sm text-muted-foreground">
      Strana {pagination.page}
    </span>

    <button
      onClick={() => setPage((p) => p + 1)}
      disabled={!pagination.hasMore}
      className="rounded border px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
    >
      Sledeća ›
    </button>
  </div>
)}        
      </div>
    </div>
  );
}