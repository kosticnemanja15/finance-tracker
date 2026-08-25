'use client';

import { useCategories } from '@/context/CategoriesContext';

interface CategoryPickerProps {
  value: number | undefined;
  onChange: (categoryId: number | undefined) => void;
  type?: 'income' | 'expense';
  disabled?: boolean;
  id?: string;
}

export function CategoryPicker({
  value,
  onChange,
  type,
  disabled,
  id,
}: CategoryPickerProps) {
  const { categories, isLoading } = useCategories();

  const options = type ? categories.filter((c) => c.type === type) : categories;

  return (
    <select
      id={id}
      value={value ?? ''}
      disabled={disabled || isLoading}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? undefined : Number(v));
      }}
      className="w-full rounded-btn border border-line bg-surface text-ink px-3 py-2 text-sm
                 transition-colors hover:bg-surface-2 focus:outline-none
                 focus-visible:shadow-[var(--focus)] disabled:opacity-50"
    >
      <option value="">
        {isLoading ? 'Loading...' : 'Choose category'}
      </option>
      {options.map((c) => (
        <option key={c.id} value={c.id}>
          {c.icon} {c.name}
        </option>
      ))}
    </select>
  );
}