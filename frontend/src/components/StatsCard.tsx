import { formatSignedRSD, formatRSD } from "@/lib/format";

type Variant = "income" | "expense" | "balance";

type StatsCardProps = {
  label: string;
  amount: number;
  variant: Variant;
};

export function StatsCard({ label, amount, variant }: StatsCardProps) {
  // Boja: income uvek teal, expense uvek coral,
  // balance zavisi od znaka (signature iz design doc-a).
  const colorClass =
    variant === "income"
      ? "text-income"
      : variant === "expense"
      ? "text-expense"
      : amount >= 0
      ? "text-income"
      : "text-expense";

  // Income/expense su uvek pozitivni brojevi (bez znaka) — smer nosi label/boja.
  // Balance dobija eksplicitan +/− jer znak JE informacija.
  const display =
    variant === "balance" ? formatSignedRSD(amount) : formatRSD(amount);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="font-sans text-sm text-muted-foreground">{label}</p>
      <p className={`font-display text-3xl tabular-nums mt-1 ${colorClass}`}>
        {display}
      </p>
    </div>
  );
}