import { z } from "zod";


export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1,"Password required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;


export const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;