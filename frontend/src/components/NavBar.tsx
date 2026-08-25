'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

// Linkovi koje svi ulogovani vide.
const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/transactions', label: 'Transactions' },
];

export function NavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Admin link samo za admina (RBAC na UI nivou — backend čuva pravu zaštitu).
  const links = [...NAV_LINKS];
  if (user?.role === 'admin') {
    links.push({ href: '/admin', label: 'Admin' });
  }

  // Inicijali za avatar (npr. "Marko Kostić" → "MK", fallback "?")
  const initials =
    user?.name
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    // sticky + blur = app chrome; border-line/bg-surface = theme-aware
    <nav className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        {/* Brand mark */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-ink">
          <span className="h-[11px] w-[11px] rounded-full bg-brand" />
          <span className="hidden sm:inline">Finance Tracker</span>
        </Link>

        {/* Linkovi */}
        <div className="ml-2 flex items-center gap-1">
          {links.map((link) => {
            const isActive =
              link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-btn px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-surface-2 text-ink font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desno: toggle + user + logout */}
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="grid h-[34px] w-[34px] place-items-center rounded-full bg-brand text-sm font-bold text-white">
                {initials}
              </div>
              <span className="text-sm font-medium text-ink">{user.name}</span>
            </div>
          )}
          <button
            onClick={logout}
            className="rounded-btn border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-[var(--focus)]"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}