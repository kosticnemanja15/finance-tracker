type Props = {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
};

// Srpski nazivi meseci (index 0 = januar)
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Tekuća + 2 unazad = 3 godine
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export function MonthYearPicker({
  year,
  month,
  onYearChange,
  onMonthChange,
}: Props) {
  const selectClass =
    "rounded-lg border border-border bg-card px-3 py-2 font-sans text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="flex gap-2">
      <select
        value={month}
        onChange={(e) => onMonthChange(Number(e.target.value))}
        className={selectClass}
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