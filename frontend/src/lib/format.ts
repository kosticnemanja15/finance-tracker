// Srpski format: tačka kao hiljadni separator, RSD suffix.
// 42350 → "42.350 RSD"
export function formatRSD(amount: number): string {
  return new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
    minimumFractionDigits: 0,   // nema para/centi — celi dinari
    maximumFractionDigits: 0,
  }).format(amount);
}

// Sa eksplicitnim +/− znakom (za balance i income/expense).
// 42350 → "+42.350 RSD",  -47000 → "−47.000 RSD"
export function formatSignedRSD(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  // Math.abs jer znak dodajemo sami — Intl bi stavio svoj "-"
  return `${sign}${formatRSD(Math.abs(amount))}`;
}