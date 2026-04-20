import { z } from 'zod';
import { USER_ROLE } from '../enums';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(USER_ROLE).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});
