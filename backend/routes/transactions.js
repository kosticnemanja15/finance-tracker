// routes/transactions.js
import { Router } from 'express';
import { transactions, getNextId } from '../data/transactions.js';
import { categories } from '../data/categories.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/ApiError.js';
import {
  TransactionIdParamSchema,
  CreateTransactionSchema,
  UpdateTransactionSchema,
} from '../schemas/transactions.js';

const router = Router();

/**
 * Cross-resource validacija: proverava da je kategorija
 * (1) postojeća, (2) vidljiva useru, (3) istog tipa kao transakcija.
 * Baca odgovarajuću grešku ili vraća kategoriju ako je sve OK.
 */
function assertCategoryUsable(categoryId, transactionType, user) {
  const category = categories.find(c => c.id === categoryId);

  // 1. Postoji?
  if (!category) {
    throw new BadRequestError('CATEGORY_NOT_FOUND', 'Category does not exist');
  }

  // 2. Vidljiva useru? (default ILI njegova privatna)
  const isVisible = category.isDefault || category.userId === user.id;
  if (!isVisible) {
    throw new ForbiddenError('Category not accessible');
  }

  // 3. Tip se poklapa? (odluka: strogo)
  if (category.type !== transactionType) {
    throw new BadRequestError(
      'CATEGORY_TYPE_MISMATCH',
      `Category type "${category.type}" does not match transaction type "${transactionType}"`
    );
  }

  return category;
}

// GET /transactions → moje transakcije (admin vidi sve)
router.get('/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = req.user.role === 'admin'
      ? transactions
      : transactions.filter(t => t.userId === req.user.id);

    res.json(result);
  })
);

// GET /transactions/:id → jedna (moja ili admin)
router.get('/:id',
  requireAuth,
  validateParams(TransactionIdParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const transaction = transactions.find(t => t.id === id);

    if (!transaction) throw new NotFoundError('Transaction not found');

    // Ownership (admin override)
    const isSelf = transaction.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) throw new ForbiddenError('Access denied');

    res.json(transaction);
  })
);

// POST /transactions → kreiraj moju
router.post('/',
  requireAuth,
  validateBody(CreateTransactionSchema),
  asyncHandler(async (req, res) => {
    const { type, amount, categoryId, description, date } = req.body;

    // Cross-resource validacija kategorije
    assertCategoryUsable(categoryId, type, req.user);

    const newTransaction = {
      id: getNextId(),
      userId: req.user.id,        // ownership — server postavlja, ne klijent
      type,
      amount,
      categoryId,
      description,
      date,
      createdAt: new Date().toISOString(),
    };

    transactions.push(newTransaction);
    res.status(201).json(newTransaction);
  })
);

// PATCH /transactions/:id → ažuriraj moju
router.patch('/:id',
  requireAuth,
  validateParams(TransactionIdParamSchema),
  validateBody(UpdateTransactionSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const transaction = transactions.find(t => t.id === id);

    if (!transaction) throw new NotFoundError('Transaction not found');

    // Ownership (admin override)
    const isSelf = transaction.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) throw new ForbiddenError('Access denied');

    // Ako se menja type ILI categoryId, ponovo validiraj kategoriju.
    // Koristimo NOVE vrednosti ako su poslate, inače postojeće.
    if (req.body.type !== undefined || req.body.categoryId !== undefined) {
      const nextType = req.body.type ?? transaction.type;
      const nextCategoryId = req.body.categoryId ?? transaction.categoryId;
      assertCategoryUsable(nextCategoryId, nextType, req.user);
    }

    Object.assign(transaction, req.body);
    res.json(transaction);
  })
);

// DELETE /transactions/:id → obriši moju
router.delete('/:id',
  requireAuth,
  validateParams(TransactionIdParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const index = transactions.findIndex(t => t.id === id);

    if (index === -1) throw new NotFoundError('Transaction not found');

    // Ownership (admin override)
    const transaction = transactions[index];
    const isSelf = transaction.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) throw new ForbiddenError('Access denied');

    transactions.splice(index, 1);
    res.status(204).end();
  })
);

export default router;