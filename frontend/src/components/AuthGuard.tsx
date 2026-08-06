"use client";  // koristi hooks (useAuth, useRouter, useEffect) → client-only

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect logika u useEffect (NE u render telu — router.push tokom
  // rendera baca grešku u React-u).
  useEffect(() => {
    // Čekaj da hydration završi. Dok isLoading, NE odlučuj ništa —
    // inače izbacimo ulogovanog usera na tren dok /auth/me ne odgovori.
    if (!isLoading && !user) {
      router.replace("/login");  // replace, ne push: ne želimo /dashboard u istoriji
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
  if (!user) {
    return null;
  }

  // 3. Ulogovan → pokaži zaštićeni sadržaj.
  return <>{children}</>;
}