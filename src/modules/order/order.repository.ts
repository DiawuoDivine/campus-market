import { eq, or } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import { orders } from '../../platform/database/schema'
import type { CreateOrderDto } from './order.dto'

export class OrderRepository {
  get db() { return getDb() }

  async findByUser(userId: string) {
    return this.db
      .select()
      .from(orders)
      .where(or(eq(orders.buyerId, userId), eq(orders.sellerId, userId)))
  }

  async findById(id: string) {
    const result = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1)
    return result[0] ?? null
  }

  async create(buyerId: string, sellerId: string, data: CreateOrderDto) {
    const id = crypto.randomUUID()
    await this.db.insert(orders).values({
      id,
      listingId: data.listingId,
      buyerId,
      sellerId,
      meetupLocation: data.meetupLocation,
      meetupTime: data.meetupTime,
      createdAt: new Date().toISOString(),
    })
    return (await this.findById(id))!
  }

  async updateStatus(id: string, status: string) {
    const completedAt = status === 'completed' ? new Date().toISOString() : undefined
    await this.db
      .update(orders)
      .set({ status: status as 'accepted', completedAt })
      .where(eq(orders.id, id))
    return this.findById(id)
  }
}
