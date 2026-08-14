"use client";  // Context + hooks + localStorage = client-only. Bez ovoga Next pokušava SSR i puca.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";  // Next 14 App Router (NE 'next/router')
import { apiFetch, setToken, clearToken, getToken, ApiError } from "@/lib/api"; // ← dodat ApiError
import type { User } from "@/types";

// ------------------------------------------------------------
// Oblik onoga što context izlaže komponentama.
// ------------------------------------------------------------
interface AuthContextType {
  user: User | null;
  isLoading: boolean;                                    // hydration state (vidi gore)
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Oblici odgovora backenda (šta apiFetch vraća).
interface AuthResponse {
  user: User;
  token: string;
}
interface MeResponse {
  user: User;
}

// Context sa undefined default-om → useAuth baca ako se koristi van providera.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ------------------------------------------------------------
// Provider — drži state, izlaže funkcije.
// ------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);      // START kao true: proveravamo pri mount-u
  const router = useRouter();

  // ---- HYDRATION: pri startu app-a, rekonstruiši usera iz tokena ----
  useEffect(() => {
    async function hydrate() {
      const token = getToken();

      // Nema tokena → sigurno nije ulogovan. Ne zovi /auth/me bezveze.
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Ima token → pitaj backend ko sam. Ovo i validira token.
      try {
        const data = await apiFetch<MeResponse>("/auth/me");
        setUser(data.user);
      } catch (err) {
        // Razlikuj "token nevažeći" od "backend nedostupan".
        if (err instanceof ApiError && err.status === 401) {
          // 401 = token stvarno nevažeći/istekao. apiFetch je već očistio token.
          // Legitimno: nisi ulogovan.
          setUser(null);
        } else {
          // Network fail, 500, timeout... backend je nedostupan ali token
          // je i dalje tu i možda validan. NE briši token —
          // sledeći refresh kad backend oживи će te rekonstruisati.
          console.error("Hydration failed (backend unreachable?):", err);
        }
      } finally {
        setIsLoading(false);  // Proverili smo — hydration gotov, bez obzira na ishod.
      }
    }

    hydrate();
  }, []);  // [] = samo jednom, pri mount-u.

  // ---- LOGIN ----
  async function login(email: string, password: string) {
    // apiFetch baca ApiError na 401/grešku → stranica hvata i prikazuje.
    const data = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);   // snimi token PRE setUser (sledeći poziv već ima token)
    setUser(data.user);
    router.push("/dashboard");  // uspeh → na dashboard
  }

  // ---- REGISTER ----
  async function register(name: string, email: string, password: string) {
    // Backend register vraća { user, token } isto kao login → auto-login.
    const data = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    router.push("/dashboard");
  }

  // ---- LOGOUT ----
  function logout() {
    clearToken();
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ------------------------------------------------------------
// useAuth — hook koji komponente koriste. Baca ako je van providera
// (rana detekcija greške umesto tihe undefined vrednosti).
// ------------------------------------------------------------
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}