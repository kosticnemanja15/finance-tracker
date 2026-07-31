// routes/transactions.js
import { Router } from 'express';
import { transactions, getNextId } from '../data/transactions.js';
import { categories } from '../data/categories.js';
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
  validateQuery(TransactionsQuerySchema),
  asyncHandler(async (req, res) => {

    let result = req.user.role === 'admin'
      ? transactions
      : transactions.filter(t => t.userId === req.user.id);

    const{type,categoryId,from,to,page,limit} = req.validatedQuery;

     if(type){
        result = result.filter(t => t.type === type);
     } 
     if(categoryId){
        result = result.filter(t => t.categoryId === categoryId);
     }
     if(from){
        result = result.filter(t => t.date >= from);
     }
      if(to){
        result = result.filter(t => t.date <= to);
     }

    // Paginacija (ako je već želiš iskoristiti)
    const total = result.length;
    const start = (page - 1) * limit;
    const end = start + limit;

    const data = result.slice(start,end);
    const hasMore = end < total;

    res.json({
        data,
        pagination: {page,total,hasMore}
    });
  })
);

router.get('/stats', 
    requireAuth,
    validateQuery(StatsQuerySchema),
    asyncHandler(async(req,res) => {
      const{year,month} = req.validatedQuery;

     
      let result = transactions.filter(t => t.userId === req.user.id);


      if (year) {
        let prefix = String(year);
        if (month) {
          prefix = `${year}-${String(month).padStart(2,'0')}`;
        }
        result = result.filter(t => t.date.startsWith(prefix));
      }

      // 3. Total income / expense — prođi JEDNOM kroz result
      //    hint: reduce ili for...of, akumuliraj dve sume
      let totalIncome = 0;
      let totalExpense = 0;
     
      for(const transaction of result){
        if(transaction.type === 'income'){
          totalIncome += transaction.amount;
        } else {
          totalExpense += transaction.amount;
        }
      }

      // 4. balance
      const balance = totalIncome - totalExpense;

      // 5. Grupiši po kategoriji
      const byCategoryMap = new Map();

      for (const t of result) {
        const current = byCategoryMap.get(t.categoryId) ?? 0;  // postojeća suma ili 0
        byCategoryMap.set(t.categoryId, current + t.amount);
      }

      // 6. Pretvori Map u niz + dodaj categoryName (lookup u categories)
      const byCategory = [];
      for (const [categoryId, total] of byCategoryMap) {
        const category = categories.find(c => c.id === categoryId);
        byCategory.push({
          categoryId,
          categoryName: category ? category.name : 'Unknown',  // guard ako je kategorija obrisana
          total,
        });
      }

      res.json({ totalIncome, totalExpense, balance, byCategory });
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