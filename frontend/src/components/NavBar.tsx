'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Linkovi koje svi ulogovani vide.
const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/transactions', label: 'Transactions' },
];

export function NavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Admin link samo za admina (RBAC na UI nivou — backend i dalje čuva pravu zaštitu).
  const links = [...NAV_LINKS];
  if (user?.role === 'admin') {
    links.push({ href: '/admin', label: 'Admin' });
  }

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Levo: linkovi */}
        <div className="flex items-center gap-1">
          {links.map((link) => {
            // Aktivan link = trenutna putanja. Dashboard tačno match,
            // ostali startsWith (da /transactions/new isto oboji Transakcije).
            const isActive =
              link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desno: ko je ulogovan + logout */}
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.name}
            </span>
          )}
          <button
            onClick={logout}
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Logut
          </button>
        </div>
      </div>
    </nav>
  );
}