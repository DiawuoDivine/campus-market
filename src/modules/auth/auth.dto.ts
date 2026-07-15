import { z } from 'zod'

export const registerSchema = z.object({
  fullName: z.string().min(2).max(200),
  indexNumber: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const loginSchema = z.object({
  identifier: z.string().min(1), // index number or email
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>
export type RefreshDto = z.infer<typeof refreshSchema>
