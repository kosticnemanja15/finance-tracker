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