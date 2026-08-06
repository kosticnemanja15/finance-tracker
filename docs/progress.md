# 📈 Progress Log

## Dan 13 — Setup + Plan (24.07.2026)

**Urađeno:**
- Monorepo strategija: `backend/` + `frontend/` (od Dana 17)
- Backend scaffold: ESM, 6 foldera, `.env` + `.env.example`
- Boilerplate: config.js (fail-fast), ApiError hijerarhija, 4 middleware-a, jwt utils
- Express 5 server: morgan → cors → express.json → `/health` → catch-all 404 → errorHandler
- Git + GitHub push (SSH), ER dijagram u `docs/`

**Odluke:**
- Delete rules: CASCADE na `Transaction.userId` i `Category.userId`, **RESTRICT** na `Transaction.categoryId` (brisanje kategorije ne sme da obriše transakcije → 409)
- `Category.userId` nullable (null = sistemska), `Transaction.userId` NOT NULL
- `asyncHandler` zadržan iako Express 5 to radi sam — eksplicitno > implicitno

**Problemi i rešenja:**
- `ERR_MODULE_NOT_FOUND` → ESM zahteva `.js` ekstenziju u relativnim importima
- HTML 404 umesto JSON → catch-all `app.use()` pre errorHandler-a
- `npm init` u pogrešnom folderu → `pwd` pre svake komande

## 📅 Dan 14 — Backend: Auth + Users

**Cilj:** Kompletan auth flow (register/login/me) + Users CRUD sa RBAC, ownership i soft delete.

### Fajlovi

- `data/users.js` — seed (Ana admin, Marko user), bcrypt hash, `isActive`, dinamički `_nextId`
- `utils/sanitize.js` — `toUserDTO`/`toUsersDTO` (whitelist DTO)
- `schemas/auth.js` — RegisterSchema (bez `role`), LoginSchema (Zod 4)
- `schemas/users.js` — UserIdParamSchema (coerce), UpdateUserSchema (`.refine()`)
- `routes/auth.js` — register, login, me
- `routes/users.js` — GET list, GET/:id, PATCH/:id, DELETE/:id
- `postman/finance-tracker.json` — collection sa auto-token logikom

### Ključni patterni

**Anti privilege-escalation (dvostruka odbrana):**
- `role` izbačen iz RegisterSchema → Zod ga strip-uje
- Handler hardkoduje `role: 'user'` — klijent ne može da postane admin

**Login security (3 sloja):**
- Timing attack protection — uvek `bcrypt.compare`, i za nepostojećeg user-a (dummy hash)
- Generička 401 poruka — ne razlikuje "email ne postoji" od "pogrešna lozinka" (anti user-enumeration)
- `isActive` provera POSLE lozinke — deaktiviran nalog sa tačnom lozinkom → 403

**Ownership pattern (jezgro projekta):**
```js
const isAdmin = req.user.role === 'admin';
const isSelf = req.user.id === user.id;
if (!isAdmin && !isSelf) throw new ForbiddenError('Access denied');
```
Admin vidi bilo koga, user vidi samo sebe.

**Pattern 1 — privilegovana polja u PATCH-u:**
```js
if (!isAdmin && (req.body.role !== undefined || req.body.isActive !== undefined)) {
  throw new ForbiddenError('You cannot change role or account status');
}
```
`!== undefined` (ne `!field`) — jer `isActive: false` je legitimna vrednost.

**Soft delete:**
- `DELETE` postavlja `isActive: false`, ne briše iz niza (audit trail)
- 204 No Content sa `.end()` (ne `.json()`)
- Ceo lifecycle: kreiraj → deaktiviraj → login odbijen (403)

### Rešeni bug-ovi

- **404 na sve rute** — mount `app.use('/auth', ...)` bio ISPOD catch-all 404. Express čita middleware redom → catch-all guta rute ispod sebe. Rešenje: rute PRE catch-all-a, error handler POSLEDNJI.

### Naučeno uz put

- `Math.max(...arr.map(...))` za dinamički ID (spread jer `Math.max` prima argumente, ne niz)
- bcrypt hash format: `$2b$10$salt+hash`, 60 karaktera, salt unutar hash-a
- JWT payload je samo base64 — nikad tajne unutra (`sub`, ne `id`; standard claim)
-

## Dan 15 — Categories + Transactions CRUD

**Cilj:** Dva nova resursa sa CRUD-om i ownership pattern-om. Prva cross-resource validacija.

### Urađeno
- `data/categories.js` — 13 default kategorija (8 expense + 5 income), model sa `isDefault` + `userId`
- `data/transactions.js` — prazan niz + `getNextId` sa guard-om za `Math.max(...[]) → -Infinity`
- `schemas/categories.js` + `schemas/transactions.js` — Zod 4 (`z.iso.date()`, `.positive().finite()`, `.strict()`, `.refine()`)
- `routes/categories.js` — CRUD sa dvoslojnim ownership-om
- `routes/transactions.js` — CRUD sa ownership + admin override + cross-resource validacija
- Sve testirano curl-om (7 testova categories + 10 transactions, svi prošli)

### Ključne dizajn odluke
- **Default kategorije menja/briše samo admin.** Privatne — samo vlasnik. Admin NE dira tuđe privatne (za razliku od users, gde ima override).
- **POST kategorije — privilegija se odlučuje serverski.** Admin → sistemska (`isDefault:true, userId:null`); user → privatna (`isDefault:false, userId:<id>`). Klijent NE šalje ta polja (`.strict()` ih odbija).
- **Transakcija i kategorija moraju biti istog tipa (strogo).** Expense transakcija samo u expense kategoriji. Razlog: Dan 16 stats bi bio pokvaren mismatch-om.

### Novi patterni
- **Cross-resource validacija** (`assertCategoryUsable`) — jedan resurs proverava drugi kroz 3 sloja:
  1. postoji? → 400 CATEGORY_NOT_FOUND
  2. vidljiva useru? → 403
  3. type se poklapa? → 400 CATEGORY_TYPE_MISMATCH
  Poziva se u POST i PATCH. U Fazi 2 → pravi foreign key.
- **PATCH consistency trik** — kad se menja samo `categoryId`, uzmi *postojeći* type transakcije za proveru: `nextType = req.body.type ?? transaction.type`. Sprečava zaobilaženje pravila.
- **Status kod semantika — URL vs body:** nepostojeći resurs iz URL-a → 404; loša referenca iz body-ja → 400. (Kategorija dolazi iz body-ja, pa 400 a ne 404.)
- **Granica schema vs ruta:** schema validira *oblik* (je li broj pozitivan), ruta validira *postojanje i odnose* (postoji li taj id, sme li ga user videti). Schema nema pristup drugim resursima.
- **Rule of Three izuzetak:** `assertCategoryUsable` izvučen na drugom ponavljanju (ne trećem) jer je logika netrivijalna (3 grane, 3 status koda) i lako se raziđe ako je duplirana.

### Reinforcement (iz Dana 14)
- Ownership guard: `if (!isSelf && !isAdmin) throw ForbiddenError`
- `.strict()` mass assignment zaštita
- Server postavlja `userId`/`createdAt`, nikad klijent

**Status:** Dan 15 završen, commit-ovan. Ostaje za Dan 16: filteri, paginacija, stats, helmet, rate-limit, README.

## Dan 16 — Filteri + Paginacija + Stats + Security Hardening

**Cilj:** Kompletirati transactions endpoint (filteri, paginacija, agregatna
statistika) i dodati production security sloj (helmet, rate limiting) + README.

### Urađeno

**Filteri na `GET /transactions`:**
- `?type`, `?categoryId`, `?from`, `?to` — svi opcioni, AND logika (lančani filteri)
- Datum poređenje preko ISO string prefiksa (leksikografski = hronološki)
- `TransactionsQuerySchema` sa `.refine()` za `from <= to` constraint (poređenje dva polja)
- `z.coerce.number()` za query params (string → number)

**Paginacija:**
- `?page&limit` sa metadata omotom: `{ data, pagination: { page, total, hasMore } }`
- `total` se hvata PRE slice-a (inače izgubljen)
- `hasMore = end < total` (end je slice end-exclusive indeks)
- Breaking change svest: response oblik promenjen sa golog niza na objekat (OK jer FE još ne postoji)

**`GET /transactions/stats` (najkompleksniji deo):**
- Route ordering: `/stats` registrovan PRE `/:id` (inače Express hvata "stats" kao :id param)
- Period filter: `?year&month` → prefix string (`"2025-06"`) + `startsWith`
  (svesno privremeno — u bazi će biti SQL agregacija)
- `month` zero-padded (`String(month).padStart(2, '0')`)
- Total income/expense: jedan prolaz `for...of` sa dva akumulatora
- `byCategory`: grupisanje preko `Map` (`get() ?? 0` pattern), pa konverzija u niz sa
  category name lookup-om (+ guard za obrisanu kategoriju)

**Security hardening:**
- **helmet** — security headeri (uklonjen `X-Powered-By`, dodati CSP, HSTS, nosniff, itd.),
  prvi u middleware chain-u
- **express-rate-limit** — izvučeno u `middleware/rateLimit.js`:
  - `globalLimiter`: 100 req / 15 min (sve rute)
  - `authLimiter`: 5 neuspešnih pokušaja / 15 min na `/auth/login` + `/register`
  - `skipSuccessfulRequests: true` — broji samo promašaje (uspešan login ne troši kvotu)
- Middleware redosled: helmet → morgan → limiter → cors → json (odbij rano, loguj sve)

**README.md:**
- Kompletna API dokumentacija (engleski — portfolio za remote EU)
- Endpoint tabele, setup uputstvo, curl primeri, error format, security pregled

### Testirano (curl)

- Filteri: type/categoryId/from/to pojedinačno + kombinovano (AND) ✓
- Range validacija: `from > to` → 400 ✓
- Paginacija: page/limit slice + metadata, prazan niz edge case ✓
- Stats: pun period, jun (year+month), prazan period (2024) — sve sume tačne ✓
- byCategory grupisanje: Hrana 2 transakcije → 1 stavka (7700) ✓
- helmet: `X-Powered-By` nestao, security headeri prisutni ✓
- globalLimiter: 100× 200, pa 429 ✓
- authLimiter: 5× 401, pa 429 ✓ (sa pogrešnom lozinkom)

### Naučeno / patterni

- Route ordering za statičke vs dinamičke rute (statička pre parametarske)
- `total` pre slice-a — redosled operacija menja rezultat
- `Map` za grupisanje/agregaciju sa `?? 0` init pattern-om
- `skipSuccessfulRequests` — rate limit koji ne kažnjava legitimne korisnike
- Middleware redosled kao performance odluka, ne samo tačnost (odbij pre nego trošiš rad)
- "Koliko robusno vredi kod čiji je životni vek kratak" — startsWith umesto date parsing
  jer ceo in-memory filter nestaje u Fazi 2

### Ostalo za kasnije (svesno preskočeno)

- Rate limit po korisniku umesto po IP-u (problem iza NAT/proxy) — Faza 2+
- Date parsing umesto string prefix — rešava baza u Fazi 2
- byCategory razdvajanje income/expense za pie chart — frontend odluka (Dan 19)

**Dan 16 završen. Backend MVP kompletan — spreman za frontend (Dan 17).**

## Dan 17 — Frontend Setup + Auth Flow

**Cilj:** Skafolđovati Next.js frontend i napraviti kompletan auth flow
(api client, context, login/register, zaštita ruta) integrisan sa backendom.

### Setup (rešen OS blocker)
- **Big Sur/Node inkompatibilnost:** Node 24 build-ovan za macOS 13+ → `dyld` crash
  na Big Sur 11.7. Rešenje: Node 20.20.0 (poslednji v20, OS-kompatibilan), zaključan
  kao nvm default. Plafon je Node 20 dok se ne promeni OS.
- Frontend reinstaliran čisto: **Next 14.2.4** (ne 16 — v16 traži noviji Node +
  Tailwind v4 frikcija). Stack: src/app, TypeScript, **Tailwind v3**, App Router.
- Paketi: react-hook-form, @hookform/resolvers, zod, next-themes, recharts, lucide-react
- **shadcn init** sa `@2.3.0` (ne @latest — najnoviji cilja Tailwind v4, mi smo v3).
  Base: Stone (topao, prati design-concept), CSS variables: Yes.
- Port 3001 (backend drži 3000), `.env.local` sa NEXT_PUBLIC_API_URL.

### Fajlovi
- `lib/api.ts` — ApiError klasa, token helpers (SSR-safe), `apiFetch<T>` wrapper
- `context/AuthContext.tsx` — login/logout/register + hydration
- `types/index.ts` — User interface (ogledalo backend DTO-a)
- `schemas/auth.ts` — LoginSchema + RegisterSchema (Zod, izdvojene kao na backendu)
- `app/login/page.tsx` + `app/register/page.tsx` — RHF + Zod forme
- `components/AuthGuard.tsx` — zaštita privatnih ruta
- `app/(protected)/layout.tsx` — route group layout sa AuthGuard-om
- `app/(protected)/dashboard/page.tsx` — placeholder (pravi dashboard = Dan 19)
- `app/page.tsx` — `/` → redirect na /dashboard

### Ključni patterni

**API client (pristup A — throw ApiError):**
- `apiFetch` baca `ApiError` na grešku (paralela backend ApiError-u), React sloj hvata
- Automatski Bearer header iz localStorage tokena
- **401 auto-cleanup** — nevažeći/istekao token se sam briše (`clearToken()` u 401 grani)
- SSR guard obavezan — `typeof window === "undefined"` pre localStorage (Next renderuje
  i na serveru gde window ne postoji)
- 204 handling — DELETE nema body, `res.json()` bi pukao bez guarda

**Hydration (opcija 1 — /auth/me):**
- Pri startu app-a: ima token? → pozovi `/auth/me` → svež user + validacija tokena
- Izabrano vs localStorage-cache jer: RBAC traži svežu rolu, token se validira odmah,
  jedan brz poziv je zanemarljiv trošak za korektnost
- **`isLoading` treće stanje** — kritično: `user: null` tokom hydration NIJE isto kao
  "nije ulogovan". Bez isLoading flag-a guard bi bacao ulogovanog usera na login pri
  svakom refresh-u (flash bug).

**Auth forme (RHF + Zod):**
- `zodResolver` spaja Zod sa React Hook Form, `z.infer` = tip iz šeme (jedan izvor istine)
- Login password: `.min(1)` (samo prisutan) — NE `.min(8)`. Jačina se validira samo pri
  registraciji, inače stari korisnici sa kraćom lozinkom ne mogu da se uloguju.
- Field greške (Zod) odvojene od backend grešaka (formError state za 401/409)
- **Sudar imena** u register-u: RHF `register` vs auth `register` → `register: registerUser`

**Route protection (opcija A — route group):**
- `(protected)` folder = route group, zagrade znače da NE utiče na URL
  (/dashboard ostaje /dashboard, ne /protected/dashboard)
- Guard se piše JEDNOM u layout-u → sve buduće privatne rute nasleđuju zaštitu
- AuthGuard tri stanja renderovanja: isLoading→"Loading", !user→null (redirect ide),
  user→children
- `router.replace` ne `push` (ne želimo redirect u istoriji browsera)
- **Obrnuti guard** na auth stranicama: ulogovan na /login → redirect na /dashboard

### Zod verzija napomena
- Frontend: **Zod 3.25.76**, backend: Zod 4 → version drift.
- 3.25 podržava obe sintakse; koristili `z.string().email()` (univerzalno sigurna).
- Poravnanje verzija = Faza 3 (monorepo shared schemas).

### Testirano (browser + DevTools)
- api.ts lanac: validan token → /auth/me 200 + Bearer header ✓
- 401 auto-cleanup: bajat token → 401 → token nestaje iz localStorage ✓
- Nema tokena → nema /auth/me poziva (efikasnost) ✓
- Login: validacija, pogrešna lozinka (401), uspešan → redirect ✓
- Register: validacija, postojeći email (409), nov → auto-login + redirect ✓
- Route guard 4 scenarija: neulogovan odbačen, ulogovan prolazi, ulogovan odbačen
  sa /login, logout čisti token ✓

### Ostalo za kasnije (svesno)
- Dizajn: login/register namerno tiho stilizovani. Brand tokeni (Bricolage font,
  coral/teal) + Balance Hero = poseban foundation korak, Dan 19.
- httpOnly cookie umesto localStorage (XSS trade-off) — Faza 2.

**Dan 17 završen. Auth flow kompletan i testiran. Spreman za Transactions UI (Dan 18).**