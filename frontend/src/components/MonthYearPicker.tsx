type Props = {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export function MonthYearPicker({
  year,
  month,
  onYearChange,
  onMonthChange,
}: Props) {
  const selectClass =
    "rounded-btn border border-line bg-surface text-ink px-3 py-2 font-sans text-sm " +
    "shadow-soft cursor-pointer transition-colors hover:bg-surface-2 " +
    "focus:outline-none focus-visible:shadow-[var(--focus)]";

  return (
    <div className="flex gap-2">
      <select
        value={month}
        onChange={(e) => onMonthChange(Number(e.target.value))}
        className={selectClass}
        aria-label="Month"
      >
        {MONTHS.map((name, index) => (
          <option key={index} value={index + 1}>
            {name}
          </option>
        ))}
      </select>

      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className={selectClass}
        aria-label="Year"
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}