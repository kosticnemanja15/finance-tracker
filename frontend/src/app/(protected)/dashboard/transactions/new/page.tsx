'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api';
import { CategoryPicker } from '@/components/CategoryPicker';
import {
  CreateTransactionSchema,
  type CreateTransactionInput,
} from '@/schemas/transactions';

export default function NewTransactionPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      // amount i categoryId namerno bez default-a → Zod hvata prazno
      date: new Date().toISOString().slice(0, 10), // danas, YYYY-MM-DD
    },
  });

  const selectedType = watch('type'); // picker prati izabrani tip

  async function onSubmit(data: CreateTransactionInput) {
    try {
      await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Transakcija dodata');
      // lista se sama refetch-uje na mount (nema keep-alive), pa je dovoljan redirect
      router.push('/dashboard/transactions');
    } catch (err) {
      // backend greška (ownership, validacija koju FE nije uhvatio, itd.)
      const message =
        err instanceof ApiError ? err.message : 'Greška pri čuvanju';
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Nova transakcija</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* TYPE — dva dugmeta, menja kategorije */}
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
                      // promena tipa → resetuj kategoriju (opcije se menjaju)
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

          {/* CATEGORY — CategoryPicker preko Controller-a */}
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
              {...register('amount', { valueAsNumber: true })} // broj, ne string
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

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-black/80 disabled:opacity-50"
            >
              {isSubmitting ? 'Čuvam...' : 'Sačuvaj'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/transactions')}
              className="rounded border px-4 py-2 text-sm hover:bg-muted"
            >
              Otkaži
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}