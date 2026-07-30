import { eq, desc, sql, like, or } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import {
  users, listings, categories, reports, adminAuditLogs,
} from '../../platform/database/schema'

export class AdminRepository {
  get db() { return getDb() }

  // ── Dashboard stats ───────────────────────────────────────────────
  async getDashboardStats() {
    const db = this.db

    const [totalUsersRes, activeUsersRes, suspendedRes, publishedRes, soldRes,
      pendingReportsRes, newThisWeekRes, topCatsRes] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.status, 'active')),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.status, 'suspended')),
      db.select({ count: sql<number>`count(*)` }).from(listings).where(eq(listings.status, 'published')),
      db.select({ count: sql<number>`count(*)` }).from(listings).where(eq(listings.status, 'sold')),
      db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, 'pending')),
      db.select({ count: sql<number>`count(*)` }).from(listings)
        .where(sql`${listings.createdAt} >= datetime('now', '-7 days')`),
      db.select({
        id: categories.id, name: categories.name, slug: categories.slug, icon: categories.icon,
        count: sql<number>`count(${listings.id})`,
      })
        .from(categories)
        .leftJoin(listings, eq(listings.categoryId, categories.id))
        .groupBy(categories.id)
        .orderBy(sql`count(${listings.id}) desc`)
        .limit(5),
    ])

    return {
      totalUsers:       Number(totalUsersRes[0]?.count ?? 0),
      activeUsers:      Number(activeUsersRes[0]?.count ?? 0),
      suspendedUsers:   Number(suspendedRes[0]?.count ?? 0),
      publishedListings: Number(publishedRes[0]?.count ?? 0),
      soldListings:     Number(soldRes[0]?.count ?? 0),
      pendingReports:   Number(pendingReportsRes[0]?.count ?? 0),
      newThisWeek:      Number(newThisWeekRes[0]?.count ?? 0),
      totalListings:    Number(publishedRes[0]?.count ?? 0) + Number(soldRes[0]?.count ?? 0),
      topCategories:    topCatsRes.map((c) => ({ ...c, count: Number(c.count) })),
    }
  }

  // ── Users ─────────────────────────────────────────────────────────
  async findUsers(params: {
    search?: string; status?: string; role?: string; limit?: number; offset?: number
  }) {
    const { search, status, role, limit = 50, offset = 0 } = params
    const conditions: ReturnType<typeof eq>[] = []

    if (status)  conditions.push(eq(users.status, status as 'active'))
    if (role)    conditions.push(eq(users.role, role as 'student'))
    if (search) {
      // Use OR across name/email/indexNumber
      const rows = await this.db
        .select()
        .from(users)
        .where(sql`(
          ${users.fullName} LIKE ${'%' + search + '%'}
          OR ${users.email} LIKE ${'%' + search + '%'}
          OR ${users.indexNumber} LIKE ${'%' + search + '%'}
        )`)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset)
      return rows
    }

    const where = conditions.length > 0
      ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
      : undefined

    return this.db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)
  }

  async updateUser(id: string, data: { role?: string; status?: string }) {
    await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id))
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] ?? null
  }

  // ── Audit logs ────────────────────────────────────────────────────
  async getAuditLogs(params: { limit?: number; offset?: number }) {
    const { limit = 50, offset = 0 } = params
    const rows = await this.db
      .select({
        log: adminAuditLogs,
        adminName: users.fullName,
      })
      .from(adminAuditLogs)
      .leftJoin(users, eq(adminAuditLogs.adminId, users.id))
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(limit)
      .offset(offset)

    return rows.map((r) => ({
      ...r.log,
      adminName: r.adminName ?? null,
      meta: r.log.meta ? JSON.parse(r.log.meta as string) : {},
    }))
  }

  async createAuditLog(data: {
    adminId: string
    action: string
    targetType?: string
    targetId?: string
    meta?: Record<string, unknown>
  }) {
    const id = crypto.randomUUID()
    await this.db.insert(adminAuditLogs).values({
      id,
      adminId:    data.adminId,
      action:     data.action,
      targetType: data.targetType,
      targetId:   data.targetId,
      meta:       JSON.stringify(data.meta ?? {}),
      createdAt:  new Date().toISOString(),
    })
  }
}
