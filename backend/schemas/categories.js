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

// POST body — NE prima isDefault/userId (to server odlučuje, ne klijent)
export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(1).max(10).default('🏷️'),
}).strict(); // odbaci nepoznata polja → mass assignment zaštita

// PATCH body — samo name i icon, oba opciona, ali bar jedno mora
export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(10).optional(),
}).strict().refine(
  (data) => data.name !== undefined || data.icon !== undefined,
  { message: 'At least one field (name or icon) must be provided' }
);