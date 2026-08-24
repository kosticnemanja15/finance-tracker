'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // mounted guard = bez hydration mismatch

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="grid place-items-center w-[38px] h-[38px] rounded-full border border-line bg-surface"
      />
    );
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="grid place-items-center w-[38px] h-[38px] rounded-full border border-line bg-surface
                 text-ink hover:bg-surface-2 focus-visible:outline-none
                 focus-visible:shadow-[var(--focus)] transition-colors"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}