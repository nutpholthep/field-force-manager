import { z } from 'zod';

export const listQuerySchema = z.object({
  sort: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
  where: z.string().optional(),
});
export type ListQueryInput = z.infer<typeof listQuerySchema>;

export const idParamSchema = z.object({ id: z.string().min(1) });
