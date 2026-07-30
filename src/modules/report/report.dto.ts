import { z } from 'zod'

export const createReportSchema = z.object({
  targetType: z.enum(['listing', 'user']),
  targetId: z.string().uuid(),
  reason: z.string().min(5).max(500),
})

export const updateReportSchema = z.object({
  status: z.enum(['reviewed', 'dismissed', 'actioned']),
  action: z.enum(['none', 'remove_listing', 'suspend_user', 'ban_user']).optional(),
  note: z.string().max(500).optional(),
})

export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'reviewed', 'dismissed', 'actioned']).optional(),
})

export type CreateReportDto = z.infer<typeof createReportSchema>
export type UpdateReportDto = z.infer<typeof updateReportSchema>
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>
