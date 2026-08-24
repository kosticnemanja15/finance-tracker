# 🎨 Day 20.5 → Port Handoff (Faza A → Faza B)

**Status:** Mockup faza (Faza A) **završena**. Tri zaključana mockup-a:
- `style-tile.html` — tokeni, tipografija, elevacija, radius, focus
- `balance-hero.html` — signature komponenta (surplus/deficit, count-up, burn bar)
- `dashboard.html` — pun kontekst (nav + hero + tx lista + category pie)

**Faza B (Dan 20.6, nov chat):** port zaključanog dizajna u pravi Next.js app. Ovaj doc je mapa + foundation config koji se drop-uje direktno.

---

## 🔒 Zaključani tokeni (jedini izvor istine)

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FBF9F7` | `#1A1522` |
| `--surface` | `#FFFDFB` | `#241E30` |
| `--surface-2` | `#F6F2EF` | `#2C2539` |
| `--border` | `#EDE7E2` | `#352C44` |
| `--text` | `#1A1625` | `#F4F0F7` |
| `--text-muted` | `#6C6577` | `#ABA1B8` |
| `--text-subtle` | `#9A93A3` | `#766D82` |
| `--brand` | `#FF5A5F` | `#FF6266` |
| `--income` | `#0FA47F` | `#1CC194` |
| `--expense` | `#E8524E` | `#FF6B67` |

**Kategorijalna paleta (ista u oba moda za sad):**
`housing #FF5A5F` · `food #F2955A` · `subscriptions #E8B04B` · `transport #A472C6` · `shopping #E0699A` · `other #9B7FA8`

**Ostalo:** radius kartica `18px` / dugme `11px` · coral focus ring · ljubičasto-tintovane senke (sm/md/lg) · Bricolage Grotesque (display) + Inter (body) + `tabular-nums` na brojevima.

---

## 📋 Port redosled (radi ovim redom)

0. **Foundation** — tokeni + fontovi + theme provider (bez ovoga ništa ne radi)
1. **BalanceHero** — signature, najveća vrednost, portuj prvi
2. **NavBar** — app chrome + theme toggle
3. **TransactionList / tx redovi** — hover, income/expense boje, tnum
4. **CategoryPieChart** — Recharts restyle sa token bojama
5. **Propagacija** — StatsCard, TransactionForm, CategoryPicker, MonthYearPicker, login/register, admin
6. **Dark QA sweep** — flip svake strane, lov na nasleđene boje

---

## 1️⃣ Foundation — spremno za drop-in

### `globals.css`

> ⚠️ Napomena: `.dark` (ne `[data-theme]`). next-themes sa `attribute="class"` dodaje `.dark` na `<html>`. shadcn takođe očekuje `.dark`.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg:#FBF9F7; --surface:#FFFDFB; --surface-2:#F6F2EF; --border:#EDE7E2;
  --text:#1A1625; --text-muted:#6C6577; --text-subtle:#9A93A3;
  --brand:#FF5A5F; --income:#0FA47F; --expense:#E8524E;
  --c-housing:#FF5A5F; --c-food:#F2955A; --c-sub:#E8B04B;
  --c-transport:#A472C6; --c-shopping:#E0699A; --c-other:#9B7FA8;
  --shadow-sm:0 1px 2px rgba(26,21,34,.05);
  --shadow-md:0 2px 4px rgba(26,21,34,.04), 0 10px 26px -8px rgba(26,21,34,.12);
  --shadow-lg:0 4px 8px rgba(26,21,34,.05), 0 20px 44px -10px rgba(26,21,34,.16);
  --ring:0 0 0 3px rgba(255,90,95,.34);
}

.dark {
  --bg:#1A1522; --surface:#241E30; --surface-2:#2C2539; --border:#352C44;
  --text:#F4F0F7; --text-muted:#ABA1B8; --text-subtle:#766D82;
  --brand:#FF6266; --income:#1CC194; --expense:#FF6B67;
  --shadow-sm:0 1px 2px rgba(0,0,0,.35);
  --shadow-md:0 2px 6px rgba(0,0,0,.35), 0 12px 30px -10px rgba(0,0,0,.55);
  --shadow-lg:0 4px 10px rgba(0,0,0,.4), 0 24px 50px -12px rgba(0,0,0,.6);
  --ring:0 0 0 3px rgba(255,98,102,.4);
}

body { background:var(--bg); color:var(--text); }
```

### `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--border)',        // "border" izbegnut da ne gazi Tailwind border utility
        ink: 'var(--text)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        brand: 'var(--brand)',
        income: 'var(--income)',
        expense: 'var(--expense)',
        cat: {
          housing: 'var(--c-housing)', food: 'var(--c-food)', sub: 'var(--c-sub)',
          transport: 'var(--c-transport)', shopping: 'var(--c-shopping)', other: 'var(--c-other)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '18px', btn: '11px' },
      boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)' },
    },
  },
  plugins: [],
};
export default config;
```

> **Opacity modifikatori** (`bg-surface/50`) NEĆE raditi sa sirovim hex u `var()`. Ako ti trebaju, čuvaj tokene kao kanale (`--brand: 255 90 95;`) i piši `brand: 'rgb(var(--brand) / <alpha-value>)'`. Za sad nam ne trebaju — preskoči dok ne zatreba.

### Fontovi — `src/app/fonts.ts`

```ts
import { Bricolage_Grotesque, Inter } from 'next/font/google';

export const display = Bricolage_Grotesque({
  subsets: ['latin'], weight: ['400','600','700','800'],
  variable: '--font-display', display: 'swap',
});

export const body = Inter({
  subsets: ['latin'], variable: '--font-body', display: 'swap',
});
```

### `src/app/layout.tsx`

```tsx
import { display, body } from './fonts';
import { ThemeProvider } from './theme-provider';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

> `suppressHydrationWarning` na `<html>` je **obavezan** sa next-themes (server ne zna temu, klijent je postavi → mismatch bez ovoga).

### `src/app/theme-provider.tsx`

```tsx
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```

### `src/components/ThemeToggle.tsx`

```tsx
'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // mounted guard — sprečava hydration mismatch (ikonica zavisi od teme)
  if (!mounted) {
    return <button aria-label="Toggle theme"
      className="grid place-items-center w-[38px] h-[38px] rounded-full border border-line bg-surface" />;
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <button onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Toggle theme"
      className="grid place-items-center w-[38px] h-[38px] rounded-full border border-line bg-surface
                 text-ink hover:bg-surface-2 focus-visible:outline-none
                 focus-visible:shadow-[var(--ring)] transition-colors">
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
```

---

## 2️⃣–4️⃣ Komponente (Faza B, sa tvojim fajlovima)

Za svaku: ti pejstuješ pravi `.tsx`, ja ga prevedem na token klase da match-uje mockup.

**BalanceHero** — `bg-surface rounded-card shadow-lg`, saldo `font-display text-[clamp(...)] tabular-nums`, boja `text-income`/`text-expense` preko conditional klase, accent linija, `↑↓` flow red, burn bar (fill `bg-expense`, width iz `expense/income`, over-100 stanje). Count-up opciono (v. dole).

**NavBar** — sticky, `backdrop-blur`, brand dot `bg-brand`, aktivan link `bg-surface-2`, `<ThemeToggle/>` desno.

**TransactionList / red** — `hover:bg-surface-2`, ikonica u `rounded-[11px] bg-surface-2`, iznos `tabular-nums text-income`/`text-expense`, filter chip aktivan `bg-surface-2` (NE coral — coral je rezervisan za hero + primarni CTA).

**CategoryPieChart (Recharts)** — donut (`innerRadius`), boje iz kat-tokena:
```tsx
<Cell fill="var(--c-housing)" />   // SVG fill prima CSS var — radi u modernim browserima
```
Restiluj `<Tooltip>` i legendu (default Recharts je generičan). Total u centru donut-a.

**Odluka za kategorije:** mapiraj boju na kategoriju. Predlog za MVP — fiksni map po imenu/tipu u `lib/categoryColors.ts` (`{ Housing: 'var(--c-housing)', ... }`), fallback `--c-other`. U Fazi 2 (baza) dodaš `color` kolonu na `categories`.

---

## ⚠️ Carry-over napomene (ne zaboravi)

- **Nasleđena boja teksta** — svaki root komponente koji ima svoju pozadinu mora imati i `text-ink` (ili nasleđivati od `body`). Bug iz Koraka 2: tekst bez eksplicitne boje pokupi stale boju i nestane u dark modu.
- **Valuta = EUR** — `lib/format.ts`: `Intl.NumberFormat('en-IE', { style:'currency', currency:'EUR' })` → `€2,847.50`. Grep ceo frontend za `RSD` i zameni.
- **`tabular-nums`** — Tailwind utility, stavi na SVAKI span sa brojem (poravnanje kolona).
- **Motion** — samo hero (count-up + burn fill). Okvir miran. Poštuj `prefers-reduced-motion`.
- **count-up** — opcioni polish. Mali `useCountUp` hook ili `react-countup`. Skoči na finalno ako reduced-motion.
- **shadcn/ui** — Dialog/Toast/Input restiluj tokenima (`bg-surface border-line`), ne default crni.
- **Theme flip tranzicija** — NE stavljaj `disableTransitionOnChange` ako hoćeš smooth prelaz; dodaj `transition-colors` na kartice/body.

---

## 🚫 Van opsega (ne diramo)

- Backend zamrznut (in-memory MVP, baza = Faza 2)
- Funkcionalna logika frontenda (hooks, context, api client) — menjamo SAMO vizuelno
- Jezik ujednačen (engleski) — ne vraćamo se

---

**Sledeći chat (Dan 20.6): kreni od Foundation (sekcija 1), pa BalanceHero. Pejstuj `globals.css` + `tailwind.config.ts` prvo.**
