import { eq } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import { users } from '../../platform/database/schema'
import type { UpdateProfileDto } from './user.dto'

export class UserRepository {
  get db() { return getDb() }

  async findById(id: string) {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] ?? null
  }

  async update(id: string, data: UpdateProfileDto) {
    await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id))
    return this.findById(id)
  }
}
