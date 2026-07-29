// routes/categories.js
import { Router } from 'express';
import { categories, getNextId } from '../data/categories.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError } from '../errors/ApiError.js';
import {
  CategoryIdParamSchema,
  CategoriesQuerySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
} from '../schemas/categories.js';

const router = Router();

// GET /categories → default (svi) + moje privatne, opciono filter po type
router.get('/',
  requireAuth,
  validateQuery(CategoriesQuerySchema),
  asyncHandler(async (req, res) => {
    const { type } = req.validatedQuery;

    // 1. Vidljivost (bezbednost): default ILI moje
    let result = categories.filter(
      c => c.isDefault || c.userId === req.user.id
    );

    // 2. Opcioni filter po tipu (kozmetika)
    if (type) {
      result = result.filter(c => c.type === type);
    }

    res.json(result);
  })
);

// POST /categories → admin pravi sistemsku, user privatnu
router.post('/',
  requireAuth,
  validateBody(CreateCategorySchema),
  asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === 'admin';

    const newCategory = {
      id: getNextId(),
      name: req.body.name,
      type: req.body.type,
      icon: req.body.icon,
      // Privilegija se odlučuje SERVERSKI na osnovu role, ne iz body-ja:
      isDefault: isAdmin,
      userId: isAdmin ? null : req.user.id,
      createdAt: new Date().toISOString(),
    };

    categories.push(newCategory);
    res.status(201).json(newCategory);
  })
);

// PATCH /categories/:id → default samo admin, privatnu samo vlasnik
router.patch('/:id',
  requireAuth,
  validateParams(CategoryIdParamSchema),
  validateBody(UpdateCategorySchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const category = categories.find(c => c.id === id);

    if (!category) throw new NotFoundError('Category not found');

    // Ownership grananje (odluka: default→admin, privatna→vlasnik)
    if (category.isDefault) {
      if (req.user.role !== 'admin') {
        throw new ForbiddenError('Only admin can modify default categories');
      }
    } else {
      if (category.userId !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }
    }

    // Menjamo samo name/icon (type je zaključan — schema ga i ne prima)
    Object.assign(category, req.body);
    res.json(category);
  })
);

// DELETE /categories/:id → isto ownership pravilo kao PATCH
router.delete('/:id',
  requireAuth,
  validateParams(CategoryIdParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const index = categories.findIndex(c => c.id === id);

    if (index === -1) throw new NotFoundError('Category not found');

    const category = categories[index];

    // Ownership grananje (isto kao PATCH)
    if (category.isDefault) {
      if (req.user.role !== 'admin') {
        throw new ForbiddenError('Only admin can delete default categories');
      }
    } else {
      if (category.userId !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }
    }

    categories.splice(index, 1);
    res.status(204).end();
  })
);

export default router;