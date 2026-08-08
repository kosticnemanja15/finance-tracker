'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api';
import { CategoryPicker } from '@/components/CategoryPicker';
import {
  UpdateTransactionSchema,
  type UpdateTransactionInput,
} from '@/schemas/transactions';
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
  const id = Number(params.id); // route param je string → number

  // fetch stanje
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTransactionInput>({
    resolver: zodResolver(UpdateTransactionSchema),
  });

  const selectedType = watch('type');

  // 1) UČITAJ transakciju na mount
  useEffect(() => {
    const signal = { cancelled: false };

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const t = await apiFetch<Transaction>(`/transactions/${id}`);
        if (signal.cancelled) return;
        // popuni formu učitanim vrednostima
        reset({
          type: t.type,
          categoryId: t.categoryId,
          amount: t.amount,
          description: t.description,
          date: t.date.slice(0, 10), // ISO → YYYY-MM-DD za <input type="date">
        });
      } catch (err) {
        if (signal.cancelled) return;
        // ownership/postojanje: 403 vs 404 vs ostalo
        if (err instanceof ApiError) {
          if (err.status === 403) setLoadError('Nemate pristup ovoj transakciji.');
          else if (err.status === 404) setLoadError('Transakcija nije pronađena.');
          else setLoadError(err.message);
        } else {
          setLoadError('Greška pri učitavanju.');
        }
      } finally {
        if (!signal.cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { signal.cancelled = true; };
  }, [id, reset]);

  // 2) SAČUVAJ izmene
  async function onSubmit(data: UpdateTransactionInput) {
    try {
      await apiFetch(`/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      toast.success('Izmene sačuvane');
      router.push('/dashboard/transactions');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Greška pri čuvanju';
      toast.error(message);
    }
  }

    async function handleDelete() {
    setIsDeleting(true);
    try {
      await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      toast.success('Transakcija obrisana');
      router.push('/dashboard/transactions');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Greška pri brisanju';
      toast.error(message);
      setIsDeleting(false); // samo na grešci — na uspehu ionako redirect-ujemo
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
            ← Nazad na listu
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: edit forma (kopija iz /new, sa PATCH submit-om) ---
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Izmeni transakciju</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* TYPE */}
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <div className="flex gap-2">
                {(['expense', 'income'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      field.onChange(opt);
                      setValue('categoryId', undefined as never);
                    }}
                    className={`flex-1 rounded border px-4 py-2 text-sm ${
                      field.value === opt
                        ? 'border-black bg-black text-white'
                        : 'border-input'
                    }`}
                  >
                    {opt === 'expense' ? 'Rashod' : 'Prihod'}
                  </button>
                ))}
              </div>
            )}
          />

          {/* CATEGORY */}
          <div className="space-y-1">
            <label htmlFor="categoryId" className="text-sm font-medium">
              Kategorija
            </label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <CategoryPicker
                  id="categoryId"
                  value={field.value}
                  onChange={field.onChange}
                  type={selectedType}
                />
              )}
            />
            {errors.categoryId && (
              <p className="text-sm text-red-600">{errors.categoryId.message}</p>
            )}
          </div>

          {/* AMOUNT */}
          <div className="space-y-1">
            <label htmlFor="amount" className="text-sm font-medium">
              Iznos
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              className="w-full rounded border px-3 py-2 text-sm"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              Opis
            </label>
            <input
              id="description"
              type="text"
              {...register('description')}
              className="w-full rounded border px-3 py-2 text-sm"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* DATE */}
          <div className="space-y-1">
            <label htmlFor="date" className="text-sm font-medium">
              Datum
            </label>
            <input
              id="date"
              type="date"
              {...register('date')}
              className="w-full rounded border px-3 py-2 text-sm"
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

<div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-black/80 disabled:opacity-50"
              >
                {isSubmitting ? 'Čuvam...' : 'Sačuvaj izmene'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/transactions')}
                className="rounded border px-4 py-2 text-sm hover:bg-muted"
              >
                Otkaži
              </button>
            </div>

            {/* Delete — desno, odvojeno, destruktivna boja */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Obriši
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white border shadow-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Obrisati transakciju?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ova akcija je nepovratna. Transakcija će biti trajno obrisana.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Otkaži</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Brišem...' : 'Obriši'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </div>
    </div>
  );
}