import { eq, or } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import { users, sessions } from '../../platform/database/schema'
import type { RegisterDto } from './auth.dto'

export interface IAuthRepository {
  findUserByIdentifier(identifier: string): Promise<typeof users.$inferSelect | null>
  findUserById(id: string): Promise<typeof users.$inferSelect | null>
  createUser(data: { fullName: string; indexNumber: string; email: string; passwordHash: string }): Promise<typeof users.$inferSelect>
  saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date, deviceInfo?: string): Promise<void>
  findSession(tokenHash: string): Promise<typeof sessions.$inferSelect | null>
  revokeSession(tokenHash: string): Promise<void>
  revokeAllUserSessions(userId: string): Promise<void>
}

export class AuthRepository implements IAuthRepository {
  get db() { return getDb() }

  async findUserByIdentifier(identifier: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.indexNumber, identifier)))
      .limit(1)
    return result[0] ?? null
  }

  async findUserById(id: string) {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] ?? null
  }

  async createUser(data: { fullName: string; indexNumber: string; email: string; passwordHash: string }) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await this.db.insert(users).values({
      id,
      fullName: data.fullName,
      indexNumber: data.indexNumber,
      email: data.email,
      passwordHash: data.passwordHash,
      createdAt: now,
      updatedAt: now,
    })
    return (await this.findUserById(id))!
  }

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date, deviceInfo?: string) {
    await this.db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      deviceInfo,
      createdAt: new Date().toISOString(),
    })
  }

  async findSession(tokenHash: string) {
    const result = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1)
    return result[0] ?? null
  }

  async revokeSession(tokenHash: string) {
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(sessions.tokenHash, tokenHash))
  }

  async revokeAllUserSessions(userId: string) {
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(sessions.userId, userId))
  }
}
