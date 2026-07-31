// schemas/transactions.js
import { z } from 'zod';

// URL param
export const TransactionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// POST body — server dodaje id/userId/createdAt, klijent ih NE šalje
export const CreateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive').finite(),
  categoryId: z.number().int().positive(),
  description: z.string().min(1, 'Description is required').max(200),
  date: z.iso.date(), // YYYY-MM-DD (npr. "2025-01-15")
}).strict();

// PATCH body — sva polja opciona, ali bar jedno mora
export const UpdateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().positive().finite().optional(),
  categoryId: z.number().int().positive().optional(),
  description: z.string().min(1).max(200).optional(),
  date: z.iso.date().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

// Query schema za GET /transactions — filteri + paginacija u jednom
export const TransactionsQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  from: z.iso.date().optional(),   // "YYYY-MM-DD"
  to: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).refine(
  // ako su oba data, from mora biti <= to
  (q) => !q.from || !q.to || q.from <= q.to,
  { message: 'from must be before or equal to to', path: ['from'] }
);

export const StatsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});