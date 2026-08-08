import { z } from 'zod';

export const CreateTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    message: 'Izaberi tip transakcije',
  }),
  amount: z
    .number({ message: 'Iznos mora biti broj' })
    .positive('Iznos mora biti veći od 0'),
  categoryId: z
    .number({ message: 'Izaberi kategoriju' })
    .int()
    .positive('Izaberi kategoriju'),
  description: z
    .string()
    .min(1, 'Opis je obavezan')
    .max(200, 'Opis je predugačak'),
  // YYYY-MM-DD — poklapa se sa <input type="date"> i backend z.string().date()
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Izaberi datum'),
});

// tip izveden iz šeme — jedan izvor istine (isti trik koji ćeš u Fazi 3 pojačati)
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

// Za MVP: edit šalje sva polja (ista pravila kao create).
// Zasebna šema jer se Create/Update razilaze čim dodaš asimetrično pravilo.
export const UpdateTransactionSchema = CreateTransactionSchema;

export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;