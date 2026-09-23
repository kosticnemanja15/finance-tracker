// routes/categories.js — A1: svaka kategorija ima vlasnika, nema deljenih.
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  CategoryIdParamSchema, CategoriesQuerySchema, CreateCategorySchema, UpdateCategorySchema,
} from '../schemas/categories.js';

const router = Router();

// GET / — samo MOJE kategorije (i admin vidi samo svoje — kategorije su lične)
router.get('/', requireAuth, validateQuery(CategoriesQuerySchema),
  asyncHandler(async (req, res) => {
    const { type } = req.validatedQuery;
    const where = { userId: req.user.id };
    if (type) where.type = type;

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },   // indeks (userId, name) pokriva WHERE + ORDER BY
    });
    res.json(categories);
  })
);

// POST / — userId UVEK sa servera, polja eksplicitno (ne spread req.body)
// Duplikat imena → P2002 (korak 5 → 409)
router.post('/', requireAuth, validateBody(CreateCategorySchema),
  asyncHandler(async (req, res) => {
    const { name, type } = req.body;
    const category = await prisma.category.create({
      data: { name, type, userId: req.user.id },
    });
    res.status(201).json(category);
  })
);

// PATCH /:id — ownership U WHERE klauzuli (jedan atomski upit)
// Tuđa ILI nepostojeća → P2025 (korak 5 → 404, isti odgovor za oba = nema enumeracije)
router.patch('/:id', requireAuth, validateParams(CategoryIdParamSchema), validateBody(UpdateCategorySchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const updated = await prisma.category.update({
      where: { id, userId: req.user.id },
      data: { name: req.body.name },
    });
    res.json(updated);
  })
);

// DELETE /:id — isto ownership pravilo
// Ima transakcije → FK Restrict → P2003 (korak 5 → 409)
router.delete('/:id', requireAuth, validateParams(CategoryIdParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    await prisma.category.delete({
      where: { id, userId: req.user.id },
      select: { id: true },
    });
    res.status(204).end();
  })
);

export default router;