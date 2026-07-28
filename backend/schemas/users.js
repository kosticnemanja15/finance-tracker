// schemas/users.js
import { z } from 'zod';

// :id iz URL-a — uvek stiže kao STRING, coerce u number
export const UserIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// PATCH body — sva polja optional, ali bar jedno mora doći
export const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.email('Invalid email format').optional(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);