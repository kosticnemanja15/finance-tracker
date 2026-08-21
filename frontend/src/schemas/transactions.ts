import { z } from 'zod';

export const CreateTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    message: 'Choose transaction type',
  }),
  amount: z
    .number({ message: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  categoryId: z
    .number({ message: 'Choose category' })
    .int()
    .positive('Choose category'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description is too long'),
  // YYYY-MM-DD — poklapa se sa <input type="date"> i backend z.string().date()
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose date'),
});

// tip izveden iz šeme — jedan izvor istine (isti trik koji ćeš u Fazi 3 pojačati)
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

// Za MVP: edit šalje sva polja (ista pravila kao create).
// Zasebna šema jer se Create/Update razilaze čim dodaš asimetrično pravilo.
export const UpdateTransactionSchema = CreateTransactionSchema;

export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;