import { eq, and } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import { favorites } from '../../platform/database/schema'

export class FavoriteRepository {
  get db() { return getDb() }

  async findByUser(userId: string) {
    return this.db.select().from(favorites).where(eq(favorites.userId, userId))
  }

  async toggle(userId: string, listingId: string): Promise<{ added: boolean }> {
    const existing = await this.db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)))
      .limit(1)

    if (existing[0]) {
      await this.db
        .delete(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)))
      return { added: false }
    }

    await this.db.insert(favorites).values({
      id: crypto.randomUUID(),
      userId,
      listingId,
      createdAt: new Date().toISOString(),
    })
    return { added: true }
  }
}
