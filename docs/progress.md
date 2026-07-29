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