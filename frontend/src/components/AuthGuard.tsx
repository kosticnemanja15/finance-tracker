"use client";  // koristi hooks (useAuth, useRouter, useEffect) → client-only

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect logika u useEffect (NE u render telu — router.push tokom
  // rendera baca grešku u React-u).
useEffect(() => {
  // Izbaci na login SAMO ako nema usera I nema tokena.
  // Ako token postoji ali user je null → backend je verovatno pao
  // tokom hydration-a. Ne izbacuj — token je i dalje validan,
  // stranica će sama pokazati grešku.
  if (!isLoading && !user && !getToken()) {
    router.replace("/login");
  }
}, [isLoading, user, router]);

  // ---- Šta se renderuje DOK odlučujemo ----

  // 1. Hydration u toku → pokaži ništa (ili spinner kasnije).
  //    Bez ovoga bi na tren blesnuo sadržaj pre redirect-a.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // 2. Hydration gotov, ali nema usera → redirect je već pokrenut u useEffect.
  //    Renderuj ništa da se privatni sadržaj NE blesne pre redirect-a.
  if (!user && !getToken()) {
    return null;
  }

  // 3. Ulogovan → pokaži zaštićeni sadržaj.
  return <>{children}</>;
}