import { z } from 'zod'

export const startConversationSchema = z.object({
  listingId: z.string().uuid(),
  sellerId: z.string().uuid(),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  attachmentUrl: z.string().url().optional(),
})

export type StartConversationDto = z.infer<typeof startConversationSchema>
export type SendMessageDto = z.infer<typeof sendMessageSchema>
