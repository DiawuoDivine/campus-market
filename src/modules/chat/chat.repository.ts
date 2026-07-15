import { eq, or, and, desc, sql, inArray } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import { conversations, messages, users, listings } from '../../platform/database/schema'

export class ChatRepository {
  get db() {
    return getDb()
  }

  /**
   * Returns enriched conversations for a user.
   * Uses separate queries instead of self-joins (avoids drizzle alias issues with bun:sqlite).
   */
  async findConversationsByUser(userId: string) {
    // 1. Fetch raw conversations
    const convRows = await this.db
      .select()
      .from(conversations)
      .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
      .orderBy(desc(conversations.createdAt))

    if (convRows.length === 0) return []

    const convIds = convRows.map((c) => c.id)

    // 2. Collect all user IDs we need (buyers + sellers)
    const userIds = [...new Set([
      ...convRows.map((c) => c.buyerId),
      ...convRows.map((c) => c.sellerId),
    ])]

    // 3. Collect all listing IDs
    const listingIds = convRows
      .map((c) => c.listingId)
      .filter((id): id is string => Boolean(id))

    // 4. Batch fetch users, listings, last messages, unread counts in parallel
    const [userRows, listingRows, lastMsgRows, unreadRows] = await Promise.all([
      userIds.length > 0
        ? this.db
            .select({ id: users.id, fullName: users.fullName, avatarUrl: users.avatarUrl })
            .from(users)
            .where(inArray(users.id, userIds))
        : [],

      listingIds.length > 0
        ? this.db
            .select({ id: listings.id, title: listings.title, price: listings.price, status: listings.status })
            .from(listings)
            .where(inArray(listings.id, listingIds))
        : [],

      // Last message per conversation — subquery via orderBy + groupBy workaround
      convIds.length > 0
        ? this.db
            .select({
              conversationId: messages.conversationId,
              content:        messages.content,
              senderId:       messages.senderId,
              createdAt:      messages.createdAt,
              readAt:         messages.readAt,
            })
            .from(messages)
            .where(
              and(
                inArray(messages.conversationId, convIds),
                sql`${messages.createdAt} = (
                  SELECT MAX(m2.created_at) FROM messages m2
                  WHERE m2.conversation_id = ${messages.conversationId}
                )`,
              ),
            )
        : [],

      // Unread counts per conversation
      convIds.length > 0
        ? this.db
            .select({
              conversationId: messages.conversationId,
              count: sql<number>`count(*)`,
            })
            .from(messages)
            .where(
              and(
                inArray(messages.conversationId, convIds),
                sql`${messages.senderId} != ${userId}`,
                sql`${messages.readAt} IS NULL`,
              ),
            )
            .groupBy(messages.conversationId)
        : [],
    ])

    // Build lookup maps
    const userMap     = new Map(userRows.map((u) => [u.id, u]))
    const listingMap  = new Map(listingRows.map((l) => [l.id, l]))
    const lastMsgMap  = new Map(lastMsgRows.map((m) => [m.conversationId, m]))
    const unreadMap   = new Map(unreadRows.map((r) => [r.conversationId, Number(r.count)]))

    return convRows.map((conv) => {
      const isBuyer     = conv.buyerId === userId
      const otherId     = isBuyer ? conv.sellerId : conv.buyerId
      const otherUser   = userMap.get(otherId)
      const listing     = conv.listingId ? listingMap.get(conv.listingId) : null
      const lastMsg     = lastMsgMap.get(conv.id)

      return {
        id:            conv.id,
        listingId:     conv.listingId ?? null,
        listingTitle:  listing?.title ?? null,
        listingPrice:  listing?.price ?? null,
        listingStatus: listing?.status ?? null,
        buyerId:       conv.buyerId,
        sellerId:      conv.sellerId,
        createdAt:     conv.createdAt,
        otherParty: {
          id:     otherId,
          name:   otherUser?.fullName  ?? 'Unknown',
          avatar: otherUser?.avatarUrl ?? null,
        },
        lastMessage: lastMsg
          ? {
              content:   lastMsg.content,
              senderId:  lastMsg.senderId,
              createdAt: lastMsg.createdAt,
              isRead:    Boolean(lastMsg.readAt),
            }
          : null,
        unreadCount: unreadMap.get(conv.id) ?? 0,
      }
    })
  }

  async findConversationById(id: string) {
    const result = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1)
    return result[0] ?? null
  }

  async findOrCreateConversation(listingId: string, buyerId: string, sellerId: string) {
    const existing = await this.db
      .select()
      .from(conversations)
      .where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, buyerId)))
      .limit(1)
    if (existing[0]) return existing[0]

    const id = crypto.randomUUID()
    await this.db.insert(conversations).values({
      id, listingId, buyerId, sellerId,
      createdAt: new Date().toISOString(),
    })
    return (await this.findConversationById(id))!
  }

  /** Returns messages in ascending order, with sender name + avatar */
  async getMessages(conversationId: string, limit = 100, offset = 0) {
    const rows = await this.db
      .select({
        id:             messages.id,
        conversationId: messages.conversationId,
        senderId:       messages.senderId,
        content:        messages.content,
        attachmentUrl:  messages.attachmentUrl,
        readAt:         messages.readAt,
        createdAt:      messages.createdAt,
        senderName:     users.fullName,
        senderAvatar:   users.avatarUrl,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)
      .limit(limit)
      .offset(offset)

    return rows.map((r) => ({
      id:             r.id,
      conversationId: r.conversationId,
      senderId:       r.senderId,
      content:        r.content,
      attachmentUrl:  r.attachmentUrl,
      readAt:         r.readAt,
      createdAt:      r.createdAt,
      sender: {
        id:     r.senderId,
        name:   r.senderName   ?? 'Unknown',
        avatar: r.senderAvatar ?? null,
      },
    }))
  }

  async createMessage(conversationId: string, senderId: string, content: string, attachmentUrl?: string) {
    const id = crypto.randomUUID()
    await this.db.insert(messages).values({
      id, conversationId, senderId, content, attachmentUrl,
      createdAt: new Date().toISOString(),
    })
    // Return with sender info
    const [msg] = await this.db
      .select({
        id:             messages.id,
        conversationId: messages.conversationId,
        senderId:       messages.senderId,
        content:        messages.content,
        attachmentUrl:  messages.attachmentUrl,
        readAt:         messages.readAt,
        createdAt:      messages.createdAt,
        senderName:     users.fullName,
        senderAvatar:   users.avatarUrl,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.id, id))
      .limit(1)

    return {
      id:             msg!.id,
      conversationId: msg!.conversationId,
      senderId:       msg!.senderId,
      content:        msg!.content,
      attachmentUrl:  msg!.attachmentUrl,
      readAt:         msg!.readAt,
      createdAt:      msg!.createdAt,
      sender: {
        id:     msg!.senderId,
        name:   msg!.senderName   ?? 'Unknown',
        avatar: msg!.senderAvatar ?? null,
      },
    }
  }

  async markMessagesRead(conversationId: string, userId: string) {
    await this.db
      .update(messages)
      .set({ readAt: new Date().toISOString() })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          sql`${messages.senderId} != ${userId}`,
          sql`${messages.readAt} IS NULL`,
        ),
      )
  }
}
