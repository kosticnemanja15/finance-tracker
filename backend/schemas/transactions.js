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