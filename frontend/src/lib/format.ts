// Money formatting — valuta je detalj implementacije, ne deo imena funkcije.
// Promeniš CURRENCY/LOCALE na jednom mestu i propagira svuda.
const LOCALE = "en-IE";     // €2,847.50 — simbol levo, zarez=hiljade, tačka=decimale
const CURRENCY = "EUR";

// 2847.5 → "€2,847.50"
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 2,   // euro ima cente
    maximumFractionDigits: 2,
  }).format(amount);
}

// Sa eksplicitnim +/− znakom (balance, income/expense).
// 2847.5 → "+€2,847.50",  -1170 → "−€1,170.00"
export function formatSignedMoney(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  // Math.abs jer znak dodajemo sami — Intl bi inače stavio svoj "-"
  return `${sign}${formatMoney(Math.abs(amount))}`;
}

