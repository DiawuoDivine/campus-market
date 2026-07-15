import { z } from 'zod'

export const createOrderSchema = z.object({
  listingId: z.string().uuid(),
  meetupLocation: z.string().max(500).optional(),
  meetupTime: z.string().datetime().optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['accepted', 'declined', 'completed', 'cancelled']),
})

export type CreateOrderDto = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>
