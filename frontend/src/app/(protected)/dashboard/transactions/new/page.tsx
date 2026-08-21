'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api';
import { TransactionForm } from '@/components/TransactionForm';
import type { CreateTransactionInput } from '@/schemas/transactions';

export default function NewTransactionPage() {
  const router = useRouter();

  async function handleSubmit(data: CreateTransactionInput) {
    try {
      await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Transaction added');
      router.push('/dashboard/transactions');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Error saving transaction';
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">New transaction</h1>
        <TransactionForm
          onSubmit={handleSubmit}
          submitLabel="Save"
          onCancel={() => router.push('/dashboard/transactions')}
        />
      </div>
    </div>
  );
}