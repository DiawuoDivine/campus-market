import { AppError } from '../../lib/appError'
import type { AdminRepository } from './admin.repository'

export class AdminService {
  constructor(private readonly repo: AdminRepository) {}

  async getDashboard() {
    return this.repo.getDashboardStats()
  }

  async listUsers(params: {
    search?: string; status?: string; role?: string; limit?: number; offset?: number
  }) {
    const users = await this.repo.findUsers(params)
    // Strip password hashes from response
    return users.map(({ passwordHash: _pw, ...safe }) => safe)
  }

  async updateUser(adminId: string, targetId: string, data: { role?: string; status?: string }) {
    const user = await this.repo.updateUser(targetId, data)
    if (!user) throw AppError.notFound('User')

    await this.repo.createAuditLog({
      adminId,
      action: data.role ? `set_role_${data.role}` : `set_status_${data.status}`,
      targetType: 'user',
      targetId,
      meta: data,
    })

    const { passwordHash: _pw, ...safe } = user
    return safe
  }

  async getAuditLogs(params: { limit?: number; offset?: number }) {
    return this.repo.getAuditLogs(params)
  }
}
