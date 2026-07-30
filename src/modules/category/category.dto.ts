import { z } from 'zod'

export const createCategorySchema = z.object({
  name:     z.string().min(1).max(100),
  slug:     z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  parentId: z.string().uuid().optional(),
  icon:     z.string().max(50).optional(),
})

export type CreateCategoryDto = z.infer<typeof createCategorySchema>
