import { eq, avg, count } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import { reviews } from '../../platform/database/schema'
import type { CreateReviewDto } from './review.dto'

export class ReviewRepository {
  get db() { return getDb() }

  async findByReviewee(revieweeId: string) {
    return this.db.select().from(reviews).where(eq(reviews.revieweeId, revieweeId))
  }

  async create(reviewerId: string, data: CreateReviewDto) {
    const id = crypto.randomUUID()
    await this.db.insert(reviews).values({
      id,
      ...data,
      reviewerId,
      createdAt: new Date().toISOString(),
    })
    const result = await this.db.select().from(reviews).where(eq(reviews.id, id)).limit(1)
    return result[0]!
  }

  async getStats(revieweeId: string) {
    const result = await this.db
      .select({ avg: avg(reviews.rating), count: count() })
      .from(reviews)
      .where(eq(reviews.revieweeId, revieweeId))
    return result[0] ?? { avg: 0, count: 0 }
  }
}
