'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/context/CategoriesContext';
import { formatSignedMoney } from '@/lib/format';
import type { Transaction } from '@/types';

// FIX: bila hardkodovana sr-RS logika bez €. Sad kroz formatSignedMoney (EUR).
function formatAmount(t: Transaction) {
  const signed = t.type === 'income' ? t.amount : -t.amount;
  return {
    text: formatSignedMoney(signed),
    className: t.type === 'income' ? 'text-income' : 'text-expense',
  };
}

// Engleski datum umesto sr-RS
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const EMPTY_FILTERS = { type: '', categoryId: '', from: '', to: '' };

const selectClass =
  "rounded-btn border border-line bg-surface text-ink px-3 py-1.5 text-sm " +
  "transition-colors focus:outline-none focus-visible:shadow-[var(--focus)]";

export default function TransactionsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const { categories, getById } = useCategories();

  const { transactions, pagination, isLoading, error } = useTransactions({
    type: filters.type ? (filters.type as 'income' | 'expense') : undefined,
    categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    page,
    limit: 5,
  });

  const categoryOptions = filters.type
    ? categories.filter((c) => c.type === filters.type)
    : categories;

  const hasActiveFilters =
    filters.type || filters.categoryId || filters.from || filters.to;

  function handleTypeChange(value: string) {
    setFilters((f) => ({ ...f, type: value, categoryId: '' }));
    setPage(1);
  }

  function handleChange(key: keyof typeof filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Transactions</h1>
        <Link
          href="/dashboard/transactions/new"
          className="rounded-btn bg-brand px-4 py-2 text-sm font-medium text-white
                     transition-colors hover:opacity-90
                     focus-visible:outline-none focus-visible:shadow-[var(--focus)]"
        >
          + New
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col flex-wrap items-stretch gap-3 rounded-card border border-line bg-surface p-4 shadow-soft sm:flex-row sm:items-end">
        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-ink-muted">Type</label>
          <select value={filters.type} onChange={(e) => handleTypeChange(e.target.value)} className={selectClass}>
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-ink-muted">Category</label>
          <select value={filters.categoryId} onChange={(e) => handleChange('categoryId', e.target.value)} className={selectClass}>
            <option value="">All</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-ink-muted">From</label>
          <input type="date" value={filters.from} onChange={(e) => handleChange('from', e.target.value)} className={selectClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">To</label>
          <input type="date" value={filters.to} onChange={(e) => handleChange('to', e.target.value)} className={selectClass} />
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }}
            className="rounded-btn border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Lista */}
      {isLoading && <p className="text-ink-muted">Loading...</p>}
      {!isLoading && error && <p className="text-expense">Error: {error}</p>}

      {!isLoading && !error && transactions.length === 0 && (
        <div className="rounded-card border border-dashed border-line p-8 text-center text-ink-muted">
          {hasActiveFilters
            ? 'No transactions match the selected filters.'
            : 'No transactions yet. Add your first one.'}
        </div>
      )}

      {!isLoading && !error && transactions.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
          {transactions.map((t) => {
            const category = getById(t.categoryId);
            const amount = formatAmount(t);
            return (
              <li key={t.id}>
                <Link
                  href={`/dashboard/transactions/${t.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-btn bg-surface-2 text-xl">
                      {category?.icon ?? '❓'}
                    </span>
                    <div>
                      <p className="font-medium text-ink">{category?.name ?? 'Unknown category'}</p>
                      <p className="text-sm text-ink-subtle">{t.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold tabular-nums ${amount.className}`}>{amount.text}</p>
                    <p className="text-sm text-ink-subtle">{formatDate(t.date)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {!isLoading && !error && transactions.length > 0 && pagination && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
            className="rounded-btn border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span className="text-sm text-ink-muted tabular-nums">Page {pagination.page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasMore}
            className="rounded-btn border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}