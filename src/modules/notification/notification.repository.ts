import { eq, desc } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import { notifications } from '../../platform/database/schema'

export class NotificationRepository {
  get db() { return getDb() }

  async findByUser(userId: string, limit = 30) {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
  }

  async markAllRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId))
  }
}
