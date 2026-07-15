import { z } from 'zod'

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(200).optional(),
  campus: z.string().max(100).optional(),
  hostel: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url().optional(),
})

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
