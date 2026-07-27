// schemas/auth.js
import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email format'), 
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password too long'),
});

export const LoginSchema = z.object({
  email: z.email('Invalid email format'), 
  password: z.string().min(1, 'Password is required'),
});