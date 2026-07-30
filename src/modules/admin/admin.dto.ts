import { z } from 'zod'

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['student', 'moderator', 'admin']).optional(),
  status: z.enum(['pending_verification', 'active', 'suspended', 'banned']).optional(),
})

export const updateUserAdminSchema = z.object({
  role: z.enum(['student', 'moderator', 'admin']).optional(),
  status: z.enum(['pending_verification', 'active', 'suspended', 'banned']).optional(),
})

export const importVerifiedStudentsSchema = z.object({
  rows: z.array(z.object({
    indexNumber: z.string().min(1),
    fullName: z.string().min(1),
    program: z.string().optional(),
    enrollmentYear: z.number().int().optional(),
  })).min(1).max(5000),
})

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>
export type UpdateUserAdminDto = z.infer<typeof updateUserAdminSchema>
export type ImportVerifiedStudentsDto = z.infer<typeof importVerifiedStudentsSchema>
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>
