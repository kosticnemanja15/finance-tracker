import { useState, useEffect, useCallback } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { User } from "@/types";


export function useUsers() {
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Isti pattern kao useTransactions: useCallback + signal objekat.
  // year/month u dependency array-u → nova load funkcija kad se promene.
  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {

      const res = await apiFetch<User[]>(`/users`);
      if (!signal?.cancelled) {
        setData(res);
      }
    } catch (err) {
      if (!signal?.cancelled) {
        setError(err instanceof ApiError ? err.message : "Failed to load users");
      }
    } finally {
      if (!signal?.cancelled) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  return { data, isLoading, error, refetch: load };
}