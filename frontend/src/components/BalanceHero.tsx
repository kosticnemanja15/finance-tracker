import { formatMoney, formatSignedMoney } from "@/lib/format";
import type { Stats } from "@/hooks/useStats";
import { ArrowUp, ArrowDown } from "lucide-react";

type Props = {
  stats: Stats;
  monthLabel: string; // npr. "August 2026"
};

export function BalanceHero({ stats, monthLabel }: Props) {
  const { totalIncome, totalExpense, balance } = stats;

  // Saldo boja: signature iz design doc-a (teal plus / coral minus)
  const isPositive = balance >= 0;
  const accentText = isPositive ? "text-income" : "text-expense";
  const accentBg = isPositive ? "bg-income" : "bg-expense";

  // Burn bar: koliko od prihoda je potrošeno. Guard protiv deljenja nulom.
  let burnPercent: number;
  if (totalIncome > 0) {
    burnPercent = (totalExpense / totalIncome) * 100;
  } else {
    burnPercent = totalExpense > 0 ? 100 : 0;
  }
  const barWidth = Math.min(burnPercent, 100); // bar clamp na 100%, tekst može >100
  const isOver = burnPercent > 100;

  return (
    // text-ink na rootu = sidro protiv dark-mode nasleđene boje
    <div className="rounded-card border border-line bg-surface text-ink shadow-hero p-8 sm:p-9">
      {/* Mesec — samo label; izbor meseca je MonthYearPicker iznad */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-sm font-semibold">
          {monthLabel}
        </span>
      </div>

      {/* Balance label + OGROMAN saldo — signature */}
      <p className="mt-6 text-sm font-medium text-ink-muted">Balance</p>
      <p
        className={`mt-1 font-display font-extrabold leading-none tabular-nums text-[clamp(42px,8vw,70px)] ${accentText}`}
      >
        {formatSignedMoney(balance)}
      </p>
      {/* accent linija — pojačava +/− signal (boja = boja salda) */}
      <div className={`mt-4 h-[5px] w-[60px] rounded-full opacity-85 ${accentBg}`} />

      {/* Prihod / rashod — podređeni saldu, sa tinted tile ikonicama */}
      <div className="mt-5 mb-7 flex gap-7">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-[26px] w-[26px] place-items-center rounded-lg text-income"
            style={{ backgroundColor: "color-mix(in srgb, var(--income) 15%, transparent)" }}
          >
            <ArrowUp size={15} strokeWidth={2.5} />
          </span>
          <div>
            <div className="text-xs leading-tight text-ink-subtle">Income</div>
            <div className="text-[15px] font-bold tabular-nums text-ink">
              {formatMoney(totalIncome)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-[26px] w-[26px] place-items-center rounded-lg text-expense"
            style={{ backgroundColor: "color-mix(in srgb, var(--expense) 15%, transparent)" }}
          >
            <ArrowDown size={15} strokeWidth={2.5} />
          </span>
          <div>
            <div className="text-xs leading-tight text-ink-subtle">Expenses</div>
            <div className="text-[15px] font-bold tabular-nums text-ink">
              {formatMoney(totalExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* Burn bar */}
      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-xs font-medium text-ink-muted">Spent this month</span>
          <span
            className={`text-[13px] font-bold tabular-nums ${isOver ? "text-expense" : "text-ink"}`}
          >
            {Math.round(burnPercent)}%
            <span className="ml-0.5 font-medium text-ink-subtle">
              {isOver ? "over budget" : "spent"}
            </span>
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full border border-line bg-surface-2">
          <div
            className="h-full rounded-full bg-expense transition-all duration-700"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}