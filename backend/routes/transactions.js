// routes/transactions.js — transakcije su LIČNE za sve uloge (Dan 12, opcija A).
// Admin uloga važi za /users (RBAC), ne za tuđe finansije (least privilege).
// Ownership pravilo: userId je UVEK u WHERE klauzuli (findFirst / update / delete),
// nikad provera u JS-u posle čitanja. Tuđe = nepostojeće = 404 (nema enumeracije id-jeva).
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { serializeTransaction, serializeTransactions } from '../utils/serialize.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError, BadRequestError } from '../errors/ApiError.js';
import {
  TransactionIdParamSchema,
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionsQuerySchema,
  StatsQuerySchema,
} from '../schemas/transactions.js';

const router = Router();

/**
 * Cross-resource validacija kategorije.
 * (1) postoji I pripada useru — jedan upit, ownership u WHERE-u
 * (2) tip se poklapa sa transakcijom
 * Tuđa i nepostojeća kategorija → ISTI odgovor (400 CATEGORY_NOT_FOUND).
 * Ranije: tuđa → 403, nepostojeća → 400 → po razlici se videlo da tuđi id postoji.
 */
async function assertCategoryUsable(categoryId, transactionType, userId) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });

  if (!category) {
    throw new BadRequestError('CATEGORY_NOT_FOUND', 'Category does not exist');
  }

  if (category.type !== transactionType) {
    throw new BadRequestError(
      'CATEGORY_TYPE_MISMATCH',
      `Category type "${category.type}" does not match transaction type "${transactionType}"`
    );
  }

  return category;
}

// ─────────────────────────────────────────────────────────────
// GET /transactions → samo MOJE + filteri + pagination
// ─────────────────────────────────────────────────────────────
router.get('/',
  requireAuth,
  validateQuery(TransactionsQuerySchema),
  asyncHandler(async (req, res) => {
    const { type, categoryId, from, to, page, limit } = req.validatedQuery;

    // Ownership je UVEK osnova where-a — i za admina (Dan 12, opcija A).
    // Transakcije su lični finansijski podaci; admin uloga važi za /users (RBAC),
    // ne za tuđe finansije (least privilege, GDPR minimizacija).
    // Posledica: WHERE "userId" = $1 je uvek prisutan → indeks (userId, date) radi za svakoga.
    const where = { userId: req.user.id };

    // Filteri — svaki dodaje ključ SAMO ako je poslat.
    if (type) {
      where.category = { type };   // type je na kategoriji → filter kroz relaciju
    }
    if (categoryId) {
      where.categoryId = categoryId;   // tuđ categoryId → prazan rezultat (userId ga seče)
    }

    // Datum opseg — from/to su stringovi, Prisma hoće Date + gte/lte.
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to)   where.date.lte = new Date(to);
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Dva upita paralelno: strana podataka + total (isti where!).
    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },   // anti-N+1 (Prisma 6: drugi upit sa IN listom)
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    const hasMore = skip + data.length < total;

    res.json({
      data: serializeTransactions(data),
      pagination: { page, total, hasMore },
    });
  })
);

// ─────────────────────────────────────────────────────────────
// GET /transactions/stats — lično, isto pravilo kao lista
// (mora biti registrovan PRE /:id, inače "stats" završi kao :id)
// ─────────────────────────────────────────────────────────────
router.get('/stats',
  requireAuth,
  validateQuery(StatsQuerySchema),
  asyncHandler(async (req, res) => {
    const { year, month } = req.validatedQuery;

    // 1. Bazni where: samo moje transakcije
    const where = { userId: req.user.id };

    // 2. Datumski filter — year/month postaju opseg [from, to).
    if (year) {
      const from = new Date(Date.UTC(year, month ? month - 1 : 0, 1));
      const to = month
        ? new Date(Date.UTC(year, month, 1))        // prvi dan sledećeg meseca
        : new Date(Date.UTC(year + 1, 0, 1));       // prvi dan sledeće godine
      where.date = { gte: from, lt: to };           // lt (ne lte) — do početka sledećeg perioda
    }

    // 3. Suma po kategoriji — groupBy radi GROUP BY u bazi.
    const grouped = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
    });

    // 4. Prazan period → rani izlaz sa nulama, bez drugog upita.
    //    Bez ovoga Prisma za `in: []` šalje `WHERE 1=0` (IN () je nevalidan SQL):
    //    baza ga reši bez čitanja tabele, ali to je i dalje mrežni round-trip
    //    (u produkciji Render → Neon). Oblik odgovora isti kao inače (ugovor).
    if (grouped.length === 0) {
      return res.json({ totalIncome: 0, totalExpense: 0, balance: 0, byCategory: [] });
    }

    // 5. Treba nam ime + tip svake kategorije (groupBy vraća samo categoryId + sumu).
    //    Jedan upit za sve kategorije iz rezultata (anti-N+1, IN lista).
    const categoryIds = grouped.map(g => g.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const catMap = new Map(categories.map(c => [c.id, c]));

    // 6. Sastavi byCategory + izračunaj totale iz istih podataka.
    let totalIncome = 0;
    let totalExpense = 0;
    const byCategory = grouped.map(g => {
      const category = catMap.get(g.categoryId);
      const total = g._sum.amount ? g._sum.amount.toNumber() : 0;   // Decimal→number

      // tip se izvodi iz kategorije → tako znamo income vs expense
      if (category?.type === 'income') totalIncome += total;
      else totalExpense += total;

      return {
        categoryId: g.categoryId,
        categoryName: category ? category.name : 'Unknown',
        total,
      };
    });

    const balance = totalIncome - totalExpense;

    res.json({ totalIncome, totalExpense, balance, byCategory });
  })
);

// ─────────────────────────────────────────────────────────────
// GET /transactions/:id — ownership U WHERE klauzuli (jedan upit)
// Tuđa ILI nepostojeća → null → 404 (isti odgovor = nema enumeracije id-jeva)
// ─────────────────────────────────────────────────────────────
router.get('/:id',
  requireAuth,
  validateParams(TransactionIdParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;

    // findFirst (ne findUnique): where ima i ne-unique polje (userId).
    // Vraća null kad nema reda — NE baca P2025 (to rade update/delete),
    // zato 404 bacamo sami.
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: req.user.id },
      include: { category: true },
    });

    if (!transaction) throw new NotFoundError('Transaction not found');

    res.json(serializeTransaction(transaction));   // Decimal→number, jednina
  })
);

// ─────────────────────────────────────────────────────────────
// POST /transactions
// ─────────────────────────────────────────────────────────────
router.post('/',
  requireAuth,
  validateBody(CreateTransactionSchema),
  asyncHandler(async (req, res) => {
    const { type, amount, categoryId, description, date } = req.body;

    await assertCategoryUsable(categoryId, type, req.user.id);

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,           // ownership — server postavlja, NE klijent
        amount,                        // Prisma prima number/string za Decimal
        description,
        date: new Date(date),          // string "YYYY-MM-DD" → Date za DateTime kolonu
        categoryId,
        // nema `type` — Transaction nema tu kolonu (izvodi se iz kategorije)
        // nema `id`/`createdAt` — baza ih daje (autoincrement / default now())
      },
      include: { category: true },     // vrati sa kategorijom, kao GET
    });

    res.status(201).json(serializeTransaction(transaction));
  })
);

// ─────────────────────────────────────────────────────────────
// PATCH /transactions/:id — parcijalni update
// Dva upita, OBA sa ownership-om u WHERE-u:
//   1) findFirst — treba nam postojeći tip (iz kategorije) za validaciju promene tipa
//   2) update    — userId i ovde: odbrana u dubini, ne oslanjamo se samo na (1)
// Red obrisan između (1) i (2) → P2025 → mapPrismaError → 404.
// `type` stiže od frontenda (ugovor), ali NIJE kolona: tip živi u kategoriji.
// ─────────────────────────────────────────────────────────────
router.patch('/:id',
  requireAuth,
  validateParams(TransactionIdParamSchema),
  validateBody(UpdateTransactionSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const userId = req.user.id;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
      select: { category: { select: { type: true } } },   // treba nam samo trenutni tip
    });
    if (!existing) throw new NotFoundError('Transaction not found');

    // type izdvajamo iz body-ja — koristi se za validaciju, ne ide u Prismu
    const { type, ...data } = req.body;
    const currentType = existing.category.type;
    const targetType = type ?? currentType;

    if (data.categoryId !== undefined) {
      // nova (ili ista) kategorija mora biti moja i odgovarati traženom tipu
      await assertCategoryUsable(data.categoryId, targetType, userId);
    } else if (targetType !== currentType) {
      // tip se ne može promeniti bez kategorije tog tipa
      throw new BadRequestError('CATEGORY_TYPE_MISMATCH',
        `Changing type to "${targetType}" requires a category of that type`);
    }

    if (data.date !== undefined) data.date = new Date(data.date);

    const updated = await prisma.transaction.update({
      where: { id, userId },
      data,
      include: { category: true },
    });

    res.json(serializeTransaction(updated));
  })
);

// ─────────────────────────────────────────────────────────────
// DELETE /transactions/:id — jedan upit, ownership u WHERE-u
// Tuđa ILI nepostojeća → P2025 → mapPrismaError → 404 (isto kao categories.js)
// ─────────────────────────────────────────────────────────────
router.delete('/:id',
  requireAuth,
  validateParams(TransactionIdParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;

    await prisma.transaction.delete({
      where: { id, userId: req.user.id },
      select: { id: true },   // ne treba nam ceo red nazad
    });

    res.status(204).end();   // 204 No Content — nema tela u odgovoru
  })
);

export default router;
