'use client';

import { useCategories } from '@/context/CategoriesContext';

interface CategoryPickerProps {
  value: number | undefined;                    // izabrani categoryId (RHF drži broj)
  onChange: (categoryId: number | undefined) => void;
  type?: 'income' | 'expense';                  // filtrira opcije po tipu
  disabled?: boolean;
  id?: string;                                  // za <label htmlFor>
}

export function CategoryPicker({
  value,
  onChange,
  type,
  disabled,
  id,
}: CategoryPickerProps) {
  const { categories, isLoading } = useCategories();

  // ako je tip zadat, pokaži samo te kategorije (rashod-forma → rashod-kategorije)
  const options = type ? categories.filter((c) => c.type === type) : categories;

  return (
    <select
      id={id}
      // select value je uvek string; '' kad ništa nije izabrano
      value={value ?? ''}
      disabled={disabled || isLoading}
      onChange={(e) => {
        const v = e.target.value;
        // '' → undefined (ništa), inače string → number za backend
        onChange(v === '' ? undefined : Number(v));
      }}
      className="w-full rounded border px-3 py-2 text-sm disabled:opacity-50"
    >
      <option value="">
        {isLoading ? 'Učitavanje...' : 'Izaberi kategoriju'}
      </option>
      {options.map((c) => (
        <option key={c.id} value={c.id}>
          {c.icon} {c.name}
        </option>
      ))}
    </select>
  );
}