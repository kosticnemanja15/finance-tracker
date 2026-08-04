// ============================================================
// API CLIENT — centralna tačka za svu komunikaciju sa backendom
// Pristup A: baca ApiError na grešku, React sloj hvata i handluje
// ============================================================

// Base URL iz env-a. NEXT_PUBLIC_ prefiks = dostupno u browseru.
// Fallback na localhost:3000 ako env nekad fali (dev safety).
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ------------------------------------------------------------
// ApiError — frontend paralela tvom backend ApiError-u.
// Kad backend vrati { error, code, details }, mi to pretvorimo
// u pravi JS exception koji nosi HTTP status + strukturu.
// Komponente hvataju OVO, ne goli fetch error.
// ------------------------------------------------------------
export class ApiError extends Error {
  status: number;                    // HTTP status (401, 404, 409, 500...)
  code: string;                      // backend code ("EMAIL_EXISTS", "UNAUTHORIZED"...)
  details?: unknown;                 // Zod validation issues (ako ih ima)

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);                  // message ide u native Error.message
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ------------------------------------------------------------
// Token helpers — jedina mesta koja diraju localStorage.
// KRITIČNO: guard za SSR. Next renderuje i na serveru gde
// window/localStorage NE POSTOJE → bez guarda pukne.
// ------------------------------------------------------------
const TOKEN_KEY = "token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;  // SSR guard
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ------------------------------------------------------------
// apiFetch — glavna funkcija. Sve što priča sa backendom
// prolazi kroz ovde. Generic <T> = tip očekivanog odgovora.
// ------------------------------------------------------------
export async function apiFetch<T>(
  endpoint: string,                          // npr. "/auth/login"
  options: RequestInit = {}                  // method, body, itd.
): Promise<T> {
  const token = getToken();

  // Sastavi headers: uvek JSON, + Bearer ako imamo token.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),  // dozvoli override
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Sam fetch. BASE_URL + endpoint (endpoint uvek počinje sa "/").
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // ---- 204 No Content: nema body-ja za parsiranje ----
  // Backend vraća 204 na DELETE. res.json() bi pukao na praznom body-ju.
  if (res.status === 204) {
    return undefined as T;
  }

  // Parsiraj JSON body. Radimo to i za uspeh i za grešku
  // jer backend grešku takođe vraća kao JSON { error, code, details }.
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    // Body nije validan JSON (retko — npr. backend padne pre nego formatira odgovor).
    body = null;
  }

  // ---- GREŠKA: status van 2xx ----
  if (!res.ok) {
    // 401 = token nevažeći/istekao. Očisti ga PRE throw-a.
    // React sloj (AuthGuard) će uhvatiti ApiError(401) i redirectovati.
    if (res.status === 401) {
      clearToken();
    }

    // Izvuci strukturu iz backend odgovora, sa fallback-ovima
    // ako body nije očekivanog oblika.
    const errBody = (body ?? {}) as {
      error?: string;
      code?: string;
      details?: unknown;
    };

    throw new ApiError(
      res.status,
      errBody.code ?? "UNKNOWN",
      errBody.error ?? `Request failed with status ${res.status}`,
      errBody.details
    );
  }

  // ---- USPEH: vrati parsirani body kao tip T ----
  return body as T;
}