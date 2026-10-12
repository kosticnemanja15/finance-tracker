// Ikonice kategorija — PREZENTACIJA, zato žive u frontendu, ne u bazi ni u API-ju.
// Ključevi = imena iz backend constants/categories.js (DEFAULT_CATEGORIES).
// Kategorija sa imenom koje nije u mapi (korisnička ili preimenovana) dobija podrazumevanu ikonicu.

const CATEGORY_ICONS: Record<string, string> = {
  // expense
  Food: '🍔',
  Housing: '🏠',
  Transport: '🚗',
  Health: '💊',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Subscriptions: '📺',
  Utilities: '💡',
  // income
  Salary: '💼',
  Bonus: '🏆',
  Gift: '🎁',
  Investments: '📈',
  Freelance: '💻',
};

export const DEFAULT_CATEGORY_ICON = '🏷️';

export function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? DEFAULT_CATEGORY_ICON;
}