import { z } from 'zod'

export const createListingSchema = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  price: z.number().int().min(1),
  condition: z.enum(['new', 'like_new', 'used', 'fair', 'poor']),
  quantity: z.number().int().min(1).default(1),
  status: z.enum(['draft', 'published']).default('published'),
  images: z.array(z.object({
    url: z.string().url(),
    position: z.number().int().min(0),
    isPrimary: z.boolean().default(false),
  })).optional(),
})

export const updateListingSchema = createListingSchema.partial()

export const listingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  condition: z.enum(['new', 'like_new', 'used', 'fair', 'poor']).optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).default('newest'),
  seller_id: z.string().uuid().optional(),
})

export type CreateListingDto = z.infer<typeof createListingSchema>
export type UpdateListingDto = z.infer<typeof updateListingSchema>
export type ListingsQuery = z.infer<typeof listingsQuerySchema>
