// routes/transactions.js
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { serializeTransaction, serializeTransactions } from '../utils/serialize.js';
// PRIVREMENO još potrebni za /:id, POST, PATCH, DELETE (migriramo ih u Koraku 4):

import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/ApiError.js';
import {
  TransactionIdParamSchema,
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionsQuerySchema,
  StatsQuerySchema,
} from '../schemas/transactions.js';

const router = Router();

/**
 * Cross-resource validacija kategorije — sada čita iz baze.
 * (1) postoji, (2) pripada useru, (3) tip se poklapa sa transakcijom.
 * async je jer radi DB upit.
 */
async function assertCategoryUsable(categoryId, transactionType, user) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  // 1. Postoji?
  if (!category) {
    throw new BadRequestError('CATEGORY_NOT_FOUND', 'Category does not exist');
  }

  // 2. Pripada useru? (A1: nema više isDefault — svaka kategorija ima vlasnika)
  if (category.userId !== user.id) {
    throw new ForbiddenError('Category not accessible');
  }

  // 3. Tip se poklapa?
  if (category.type !== transactionType) {
    throw new BadRequestError(
      'CATEGORY_TYPE_MISMATCH',
      `Category type "${category.type}" does not match transaction type "${transactionType}"`
    );
  }

  return category;
}

// ─────────────────────────────────────────────────────────────
// GET /transactions → moje (admin sve) + filteri + pagination  [MIGRIRANO — Korak 2 v2]
// ─────────────────────────────────────────────────────────────
router.get('/',
  requireAuth,
  validateQuery(TransactionsQuerySchema),
  asyncHandler(async (req, res) => {
    const { type, categoryId, from, to, page, limit } = req.validatedQuery;

    // Ownership je osnova where-a: admin {} (sve), user { userId }.
    const where = req.user.role === 'admin'
      ? {}
      : { userId: req.user.id };

    // Filteri — svaki dodaje ključ SAMO ako je poslat.
    if (type) {
      where.category = { type };   // type je na kategoriji → filter kroz relaciju
    }
    if (categoryId) {
      where.categoryId = categoryId;
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
        include: { category: true },   // anti-N+1
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
// GET /transactions/stats  [IN-MEMORY — migrira se u Koraku 6]
// ─────────────────────────────────────────────────────────────
router.get('/stats',
  requireAuth,
  validateQuery(StatsQuerySchema),
  asyncHandler(async (req, res) => {
    const { year, month } = req.validatedQuery;

    // 1. Bazni where: samo moje transakcije (stats je uvek lični, ne admin-sve)
    const where = { userId: req.user.id };

    // 2. Datumski filter — year/month postaju opseg [from, to).
    //    Umesto starog date.startsWith trika: pravi DateTime opseg.
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

    // 4. Treba nam ime + tip svake kategorije (groupBy vraća samo categoryId + sumu).
    //    Jedan upit za sve kategorije iz rezultata (anti-N+1, IN lista).
    const categoryIds = grouped.map(g => g.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const catMap = new Map(categories.map(c => [c.id, c]));

    // 5. Sastavi byCategory + izračunaj totale iz istih podataka.
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
// GET /transactions/:id  [IN-MEMORY — migrira se u Koraku 4]
// ─────────────────────────────────────────────────────────────
router.get('/:id',
  requireAuth,
  validateParams(TransactionIdParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!transaction) throw new NotFoundError('Transaction not found');

    // Ownership (admin override) — ista logika, radi na objektu iz baze
    const isSelf = transaction.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) throw new ForbiddenError('Access denied');

    res.json(serializeTransaction(transaction));   // Decimal→number, jednina
  })
);

// ─────────────────────────────────────────────────────────────
// POST /transactions  [IN-MEMORY — migrira se u Koraku 4]
// ─────────────────────────────────────────────────────────────
router.post('/',
  requireAuth,
  validateBody(CreateTransactionSchema),
  asyncHandler(async (req, res) => {
    const { type, amount, categoryId, description, date } = req.body;

    // Validacija kategorije iz baze (await jer je sad async)
    await assertCategoryUsable(categoryId, type, req.user);

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,           // ownership — server postavlja, NE klijent
        amount,                        // Prisma prima number/string za Decimal
        description,
        date: new Date(date),          // string "YYYY-MM-DD" → Date za DateTime kolonu
        categoryId,
        // NAPOMENA: nema `type` — Transaction nema tu kolonu (izvodi se iz kategorije)
        // NAPOMENA: nema `id`/`createdAt` — baza ih daje (autoincrement / default now())
      },
      include: { category: true },     // vrati sa kategorijom, kao GET
    });

    res.status(201).json(serializeTransaction(transaction));
  })
);

// PATCH /:id — parcijalni update
// `type` stiže od frontenda (ugovor), ali NIJE kolona: tip živi u kategoriji.
router.patch('/:id', requireAuth, validateParams(TransactionIdParamSchema), validateBody(UpdateTransactionSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const existing = await prisma.transaction.findUnique({ where: { id }, include: { category: true } });
    if (!existing) throw new NotFoundError('Transaction not found');
    const isSelf = existing.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) throw new ForbiddenError('Access denied');

    // type izdvajamo iz body-ja — koristi se za validaciju, ne ide u Prismu
    const { type, ...data } = req.body;
    const targetType = type ?? existing.category.type;

    if (data.categoryId !== undefined) {
      // nova (ili ista) kategorija mora da odgovara traženom tipu
      await assertCategoryUsable(data.categoryId, targetType, req.user);
    } else if (targetType !== existing.category.type) {
      // tip se ne može promeniti bez kategorije tog tipa
      throw new BadRequestError('CATEGORY_TYPE_MISMATCH',
        `Changing type to "${targetType}" requires a category of that type`);
    }

    if (data.date !== undefined) data.date = new Date(data.date);
    const updated = await prisma.transaction.update({ where: { id }, data, include: { category: true } });
    res.json(serializeTransaction(updated));
  })
);

// ─────────────────────────────────────────────────────────────
// DELETE /transactions/:id  [IN-MEMORY — migrira se u Koraku 4]
// ─────────────────────────────────────────────────────────────
router.delete('/:id',
  requireAuth,
  validateParams(TransactionIdParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;

    // Nađi prvo — za ownership proveru (i da razlikujemo 404 od 403)
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundError('Transaction not found');

    const isSelf = existing.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) throw new ForbiddenError('Access denied');

    await prisma.transaction.delete({
      where: { id },
    });

    res.status(204).end();   // 204 No Content — nema tela u odgovoru
  })
);

export default router;