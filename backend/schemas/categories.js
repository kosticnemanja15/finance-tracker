// schemas/categories.js
import { z } from 'zod';

// URL param — string iz URL-a → broj
export const CategoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Query filter za GET /categories
export const CategoriesQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
});

// POST body — NE prima userId (server odlučuje). A1: nema icon/isDefault.
export const CreateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name too long'),
  type: z.enum(['income', 'expense']),
}).strict(); // nepoznata polja → 400 (mass assignment zaštita)

// PATCH body — samo name. type je nepromenljiv:
// transakcije nemaju svoj type, izvode ga iz kategorije → promena bi prebacila
// sve postojeće transakcije na drugu stranu bilansa.
export const UpdateCategorySchema = z.object({
  name: z.string().trim().min(1).max(50),
}).strict();