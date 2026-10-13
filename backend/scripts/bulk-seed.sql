-- scripts/bulk-seed.sql — bulk podaci za EXPLAIN ANALYZE. SAMO LOKALNO.
--
-- Pokretanje (iz backend/):  psql -d finance_tracker -f scripts/bulk-seed.sql
--
-- Pravi 40 korisnika @bulk.local (po 250 transakcija) + po 500 za Anu i Marka.
-- Idempotentno: prvo briše SVOJ prethodni bulk ([bulk] opis, @bulk.local email),
-- pravi podaci (seed + ručno uneti) se ne diraju.

\set ON_ERROR_STOP on

-- ── Zaštita: odbij sve osim lokalnog servera ─────────────────────────────
-- inet_server_addr() = NULL kad je konekcija preko Unix socketa (lokalno),
-- 127.0.0.1 / ::1 preko lokalnog TCP-a. Neon bi vratio svoju IP adresu.
SELECT (inet_server_addr() IS NULL
        OR host(inet_server_addr()) IN ('127.0.0.1', '::1')) AS is_local
\gset

\if :is_local
  \echo '🎯 Lokalna baza — nastavljam.'
\else
  \echo '❌ Odbijeno: ovo nije lokalni server. Bulk seed je SAMO za lokal.'
  \quit
\endif

BEGIN;

-- ── 0. Očisti prethodni bulk ─────────────────────────────────────────────
-- Prvo transakcije (Category ima ON DELETE RESTRICT prema Transaction),
-- pa korisnici (kaskadno brišu svoje kategorije).
DELETE FROM "Transaction" WHERE description LIKE '[bulk]%';
DELETE FROM "User"        WHERE email LIKE '%@bulk.local';

-- ── 1. 40 bulk korisnika ─────────────────────────────────────────────────
-- generate_series(1, 40) = "tabela" sa brojevima 1..40, po jedan red za svakog.
-- Lozinka = Anin hash (password123), pa se bulk korisnik može ulogovati ako zatreba.
-- role, isActive, createdAt dolaze iz DEFAULT-a u bazi.
INSERT INTO "User" (name, email, "passwordHash")
SELECT 'Bulk ' || n,
       'bulk' || n || '@bulk.local',
       (SELECT "passwordHash" FROM "User" WHERE email = 'ana@test.com')
FROM generate_series(1, 40) AS n;

-- ── 2. Kategorije: Anin set kao šablon, kopija za svakog bulk korisnika ──
-- CROSS JOIN = svaki bulk korisnik × svaka Anina kategorija (40 × 13 = 520 redova).
INSERT INTO "Category" (name, type, "userId")
SELECT c.name, c.type, u.id
FROM "User" u
CROSS JOIN "Category" c
WHERE u.email LIKE '%@bulk.local'
  AND c."userId" = (SELECT id FROM "User" WHERE email = 'ana@test.com');

-- ── 3. Transakcije ───────────────────────────────────────────────────────
-- targets: za svakog ciljnog korisnika koliko redova (n) i niz njegovih kategorija (cats).
-- LATERAL generate_series(1, t.n): za svaki red iz targets napravi t.n redova.
-- random() se računa za SVAKI red posebno (volatile funkcija).
WITH targets AS (
  SELECT u.id,
         CASE WHEN u.email LIKE '%@bulk.local' THEN 250 ELSE 500 END AS n,
         array_agg(c.id) AS cats
  FROM "User" u
  JOIN "Category" c ON c."userId" = u.id
  WHERE u.email LIKE '%@bulk.local'
     OR u.email IN ('ana@test.com', 'marko@test.com')
  GROUP BY u.id, u.email
)
INSERT INTO "Transaction" (amount, description, date, "userId", "categoryId")
SELECT
  round((5 + random() * 495)::numeric, 2),                       -- 5.00 – 500.00
  '[bulk] #' || g,
  date_trunc('day',                                              -- ponoć, kao iz aplikacije
    timestamp '2024-01-01'
    + random() * (timestamp '2026-10-13' - timestamp '2024-01-01')),
  t.id,
  t.cats[1 + floor(random() * array_length(t.cats, 1))::int]     -- nasumična SVOJA kategorija
FROM targets t
CROSS JOIN LATERAL generate_series(1, t.n) AS g;

COMMIT;

-- ── 4. Osveži statistiku planera ─────────────────────────────────────────
-- Planner bira plan na osnovu statistike (broj redova, raspodela vrednosti).
-- Posle bulk insert-a ona je zastarela dok autovacuum ne odradi svoje.
-- Bez ANALYZE bi EXPLAIN merio plan napravljen za ~10 redova.
ANALYZE "Transaction";
ANALYZE "Category";
ANALYZE "User";

-- ── 5. Provera ───────────────────────────────────────────────────────────
SELECT count(*) AS total_transactions FROM "Transaction";

SELECT u.id, u.email, count(*) AS tx
FROM "Transaction" t
JOIN "User" u ON u.id = t."userId"
GROUP BY u.id, u.email
ORDER BY tx DESC
LIMIT 5;
