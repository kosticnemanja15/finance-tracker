'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Category } from '@/types';

interface CategoriesContextValue {
  categories: Category[];
  getById: (id: number) => Category | undefined; // za display u listi
  isLoading: boolean;
  error: string | null;
}

const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();                    // fetch tek kad imamo usera
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;                           // bez auth-a nema smisla

    let cancelled = false;                        // guard protiv race/unmount
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        // pretpostavka: backend vraća goli niz Category[] (proverićemo u testu)
        const data = await apiFetch<Category[]>('/categories');
        if (!cancelled) setCategories(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load categories');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  const getById = (id: number) => categories.find((c) => c.id === id);

  return (
    <CategoriesContext.Provider value={{ categories, getById, isLoading, error }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within CategoriesProvider');
  return ctx;
}