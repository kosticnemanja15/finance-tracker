import { formatRSD, formatSignedRSD } from "@/lib/format";
import type { Stats } from "@/hooks/useStats";

type Props = {
  stats: Stats;
  monthLabel: string; // npr. "Avgust 2026"
};

export function BalanceHero({ stats, monthLabel }: Props) {
  const { totalIncome, totalExpense, balance } = stats;

  // Saldo boja: signature iz design doc-a (teal plus / coral minus)
  const isPositive = balance >= 0;
  const balanceColor = isPositive ? "text-income" : "text-expense";

  // Burn bar: koliko od prihoda je potrošeno.
  // Guard protiv deljenja nulom.
  let burnPercent: number;
  if (totalIncome > 0) {
    burnPercent = (totalExpense / totalIncome) * 100;
  } else {
    // Nema prihoda: ako ima rashoda → pun bar (100%), inače prazan
    burnPercent = totalExpense > 0 ? 100 : 0;
  }

  // Bar se ne puni preko 100% vizuelno (clamp), ali procenat u tekstu
  // može da bude >100 (npr. "potrošio 140% prihoda")
  const barWidth = Math.min(burnPercent, 100);

  // Bar boja: ispod 100% trošiš manje nego što zaradiš (teal),
  // 100%+ znači u minusu (coral)
  const barColor = burnPercent >= 100 ? "bg-expense" : "bg-income";

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      {/* Mesec */}
      <p className="font-sans text-sm text-muted-foreground">{monthLabel}</p>

      {/* OGROMAN saldo — signature */}
      <p
        className={`font-display text-5xl sm:text-6xl tabular-nums mt-2 ${balanceColor}`}
      >
        {formatSignedRSD(balance)}
      </p>

      {/* Prihod / rashod red — podređeni saldu */}
      <div className="flex gap-6 mt-3 font-sans text-sm">
        <span className="text-muted-foreground">
          <span className="text-income">↑</span> income{" "}
          <span className="tabular-nums">{formatRSD(totalIncome)}</span>
        </span>
        <span className="text-muted-foreground">
          <span className="text-expense">↓</span> expense{" "}
          <span className="tabular-nums">{formatRSD(totalExpense)}</span>
        </span>
      </div>

      {/* Burn bar */}
      <div className="mt-6">
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <p className="font-sans text-xs text-muted-foreground mt-2 tabular-nums">
          {Math.round(burnPercent)}% spent
        </p>
      </div>
    </div>
  );
}