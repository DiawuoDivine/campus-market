import { eq, desc, sql } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import { reports, users, listings } from '../../platform/database/schema'

export class ReportRepository {
  get db() { return getDb() }

  async findAll(params: { status?: string; limit?: number; offset?: number }) {
    const { status, limit = 50, offset = 0 } = params

    const rows = await this.db
      .select({
        report: reports,
        reporterName: users.fullName,
      })
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.id))
      .where(status ? eq(reports.status, status as 'pending') : undefined)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset)

    // Enrich with target labels
    const enriched = await Promise.all(rows.map(async (r) => {
      let targetLabel: string | null = null
      if (r.report.targetType === 'listing') {
        const listing = await this.db
          .select({ title: listings.title })
          .from(listings)
          .where(eq(listings.id, r.report.targetId))
          .limit(1)
        targetLabel = listing[0]?.title ?? null
      } else if (r.report.targetType === 'user') {
        const user = await this.db
          .select({ fullName: users.fullName })
          .from(users)
          .where(eq(users.id, r.report.targetId))
          .limit(1)
        targetLabel = user[0]?.fullName ?? null
      }
      return { ...r.report, reporterName: r.reporterName ?? null, targetLabel }
    }))

    return enriched
  }

  async findById(id: string) {
    const result = await this.db.select().from(reports).where(eq(reports.id, id)).limit(1)
    return result[0] ?? null
  }

  async create(data: {
    reporterId: string; targetType: string; targetId: string; reason: string
  }) {
    const id = crypto.randomUUID()
    await this.db.insert(reports).values({
      id,
      reporterId:  data.reporterId,
      targetType:  data.targetType as 'listing' | 'user',
      targetId:    data.targetId,
      reason:      data.reason,
      createdAt:   new Date().toISOString(),
    })
    return this.findById(id)
  }

  async updateStatus(id: string, status: string) {
    await this.db
      .update(reports)
      .set({ status: status as 'pending' })
      .where(eq(reports.id, id))
    return this.findById(id)
  }
}
