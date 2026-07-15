import { AppError } from '../../lib/appError'
import type { ChatRepository } from './chat.repository'
import type { StartConversationDto, SendMessageDto } from './chat.dto'

export class ChatService {
  constructor(private readonly repo: ChatRepository) {}

  async getConversations(userId: string) {
    return this.repo.findConversationsByUser(userId)
  }

  async startConversation(buyerId: string, dto: StartConversationDto) {
    if (buyerId === dto.sellerId) throw AppError.badRequest('Cannot message yourself')
    return this.repo.findOrCreateConversation(dto.listingId, buyerId, dto.sellerId)
  }

  async getMessages(conversationId: string, userId: string) {
    const conv = await this.repo.findConversationById(conversationId)
    if (!conv) throw AppError.notFound('Conversation')
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      throw AppError.forbidden('Not a participant of this conversation')
    }
    // Mark incoming messages as read when fetched
    await this.repo.markMessagesRead(conversationId, userId)
    return this.repo.getMessages(conversationId)
  }

  async sendMessage(conversationId: string, senderId: string, dto: SendMessageDto) {
    const conv = await this.repo.findConversationById(conversationId)
    if (!conv) throw AppError.notFound('Conversation')
    if (conv.buyerId !== senderId && conv.sellerId !== senderId) {
      throw AppError.forbidden('Not a participant of this conversation')
    }
    return this.repo.createMessage(conversationId, senderId, dto.content, dto.attachmentUrl)
  }
}
