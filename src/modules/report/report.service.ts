import { AppError } from '../../lib/appError'
import type { ReportRepository } from './report.repository'
import type { AdminRepository } from '../admin/admin.repository'
import { getDb } from '../../platform/database/client'
import { users, listings } from '../../platform/database/schema'
import { eq } from 'drizzle-orm'

export class ReportService {
  constructor(
    private readonly repo: ReportRepository,
    private readonly adminRepo: AdminRepository,
  ) {}

  async list(params: { status?: string; limit?: number; offset?: number }) {
    return this.repo.findAll(params)
  }

  async create(reporterId: string, data: { targetType: string; targetId: string; reason: string }) {
    return this.repo.create({ reporterId, ...data })
  }

  async resolve(
    adminId: string,
    reportId: string,
    update: { status: string; action?: string; note?: string },
  ) {
    const report = await this.repo.findById(reportId)
    if (!report) throw AppError.notFound('Report')

    // Perform side-effects based on action
    const db = getDb()
    if (update.action === 'remove_listing' && report.targetType === 'listing') {
      await db.update(listings).set({ status: 'archived' }).where(eq(listings.id, report.targetId))
    } else if (update.action === 'suspend_user' && report.targetType === 'user') {
      await db.update(users).set({ status: 'suspended', updatedAt: new Date().toISOString() })
        .where(eq(users.id, report.targetId))
    } else if (update.action === 'ban_user' && report.targetType === 'user') {
      await db.update(users).set({ status: 'banned', updatedAt: new Date().toISOString() })
        .where(eq(users.id, report.targetId))
    }

    const updated = await this.repo.updateStatus(reportId, update.status)

    await this.adminRepo.createAuditLog({
      adminId,
      action: `report_${update.status}${update.action ? `_${update.action}` : ''}`,
      targetType: report.targetType,
      targetId:   report.targetId,
      meta: { reportId, note: update.note },
    })

    return updated
  }
}
