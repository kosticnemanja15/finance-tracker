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
  extraActions?: React.ReactNode;
}

// Zajednički stil za text/number/date input-e
const inputClass =
  "w-full rounded-btn border border-line bg-surface text-ink px-3 py-2 text-sm " +
  "transition-colors focus:outline-none focus-visible:shadow-[var(--focus)] " +
  "placeholder:text-ink-subtle";

const labelClass = "text-sm font-medium text-ink";
const errorClass = "text-sm text-expense";

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
      ...defaultValues,
    },
  });

  const selectedType = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* TYPE — aktivni tip nosi svoju boju (coral/teal), ne crnu */}
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map((opt) => {
              const active = field.value === opt;
              const activeStyle =
                opt === 'expense'
                  ? 'border-expense bg-expense text-white'
                  : 'border-income bg-income text-white';
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    field.onChange(opt);
                    setValue('categoryId', undefined as never);
                  }}
                  className={`flex-1 rounded-btn border px-4 py-2 text-sm font-medium transition-colors ${
                    active ? activeStyle : 'border-line text-ink-muted hover:bg-surface-2'
                  }`}
                >
                  {opt === 'expense' ? 'Expense' : 'Income'}
                </button>
              );
            })}
          </div>
        )}
      />

      {/* CATEGORY */}
      <div className="space-y-1">
        <label htmlFor="categoryId" className={labelClass}>Category</label>
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
          <p className={errorClass}>{errors.categoryId.message}</p>
        )}
      </div>

      {/* AMOUNT */}
      <div className="space-y-1">
        <label htmlFor="amount" className={labelClass}>Amount</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          {...register('amount', { valueAsNumber: true })}
          className={`${inputClass} tabular-nums`}
        />
        {errors.amount && <p className={errorClass}>{errors.amount.message}</p>}
      </div>

      {/* DESCRIPTION */}
      <div className="space-y-1">
        <label htmlFor="description" className={labelClass}>Description</label>
        <input
          id="description"
          type="text"
          {...register('description')}
          className={inputClass}
        />
        {errors.description && (
          <p className={errorClass}>{errors.description.message}</p>
        )}
      </div>

      {/* DATE */}
      <div className="space-y-1">
        <label htmlFor="date" className={labelClass}>Date</label>
        <input
          id="date"
          type="date"
          {...register('date')}
          className={inputClass}
        />
        {errors.date && <p className={errorClass}>{errors.date.message}</p>}
      </div>

      {/* AKCIJE */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-btn bg-brand px-4 py-2 text-sm font-medium text-white
                       transition-colors hover:opacity-90 disabled:opacity-50
                       focus-visible:outline-none focus-visible:shadow-[var(--focus)]"
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-btn border border-line px-4 py-2 text-sm font-medium text-ink
                       transition-colors hover:bg-surface-2"
          >
            Cancel
          </button>
        </div>
        {extraActions}
      </div>
    </form>
  );
}