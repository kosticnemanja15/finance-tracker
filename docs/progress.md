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

**Ostaje za sutra:** —

---