'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api';
import { TransactionForm } from '@/components/TransactionForm';
import type { CreateTransactionInput } from '@/schemas/transactions';
import type { Transaction } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  // fetch stanje
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1) UČITAJ transakciju na mount
  useEffect(() => {
    const signal = { cancelled: false };

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const t = await apiFetch<Transaction>(`/transactions/${id}`);
        if (signal.cancelled) return;
        setTransaction(t);
      } catch (err) {
        if (signal.cancelled) return;
        if (err instanceof ApiError) {
          if (err.status === 403) setLoadError("You don't have access to this transaction.");
          else if (err.status === 404) setLoadError('Transaction not found.');
          else setLoadError(err.message);
        } else {
          setLoadError('Error loading transaction.');
        }
      } finally {
        if (!signal.cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { signal.cancelled = true; };
  }, [id]);

  // 2) SAČUVAJ izmene
  async function handleSubmit(data: CreateTransactionInput) {
    try {
      await apiFetch(`/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      toast.success('Changes saved');
      router.push('/dashboard/transactions');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error saving transaction';
      toast.error(message);
    }
  }

  // 3) OBRIŠI
  async function handleDelete() {
    setIsDeleting(true);
    try {
      await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      toast.success('Transaction deleted');
      router.push('/dashboard/transactions');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error deleting transaction';
      toast.error(message);
      setIsDeleting(false);
    }
  }

  // --- RENDER: loading ---
  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // --- RENDER: 403 / 404 / greška ---
  if (loadError) {
    return (
      <div className="min-h-screen p-8">
        <div className="mx-auto max-w-md space-y-4">
          <p className="text-red-600">{loadError}</p>
          <button
            onClick={() => router.push('/dashboard/transactions')}
            className="rounded border px-4 py-2 text-sm hover:bg-muted"
          >
            ← Back to list
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: edit forma (transaction je učitan) ---
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Edit Transaction</h1>
        <TransactionForm
          defaultValues={{
            type: transaction!.type,
            categoryId: transaction!.categoryId,
            amount: transaction!.amount,
            description: transaction!.description,
            date: transaction!.date.slice(0, 10),
          }}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          onCancel={() => router.push('/dashboard/transactions')}
          extraActions={
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white border shadow-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The transaction will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        />
      </div>
    </div>
  );
}