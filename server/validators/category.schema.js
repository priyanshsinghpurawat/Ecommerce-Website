import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().trim().optional(),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const updateCategorySchema = createCategorySchema.partial();
