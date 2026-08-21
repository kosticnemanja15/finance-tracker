'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CategoryPicker } from '@/components/CategoryPicker';
import {
  CreateTransactionSchema,
  type CreateTransactionInput,
} from '@/schemas/transactions';

interface TransactionFormProps {
  defaultValues?: Partial<CreateTransactionInput>;
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
  extraActions?: React.ReactNode; // slot za delete (edit-only)
}

export function TransactionForm({
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
  extraActions,
}: TransactionFormProps) {
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
      date: new Date().toISOString().slice(0, 10),
      ...defaultValues, // parent-ove vrednosti pregaze default-e (edit slučaj)
    },
  });

  const selectedType = watch('type');

  return (
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
                {opt === 'expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>
        )}
      />

      {/* CATEGORY */}
      <div className="space-y-1">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Cetegory
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
          Amount
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
          Description
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
          Date
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

      {/* AKCIJE — submit + cancel levo, extraActions (delete) desno */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-black/80 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded border px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
        </div>
        {extraActions}
      </div>
    </form>
  );
}