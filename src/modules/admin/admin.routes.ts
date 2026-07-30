import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth'
import { ok } from '../../lib/response'
import { param } from '../../lib/param'
import { parsePagination } from '../../lib/pagination'
import type { AdminService } from './admin.service'

export function adminRouter(service: AdminService): Router {
  const router = Router()
  // All admin routes require auth + admin or moderator role
  router.use(requireAuth)

  // GET /admin/dashboard
  router.get('/dashboard', requireRole('admin', 'moderator'), async (_req: Request, res: Response) => {
    ok(res, await service.getDashboard())
  })

  // GET /admin/users
  router.get('/users', requireRole('admin'), async (req: Request, res: Response) => {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>)
    const users = await service.listUsers({
      search:  req.query['search'] as string | undefined,
      status:  req.query['status'] as string | undefined,
      role:    req.query['role']   as string | undefined,
      limit,
      offset,
    })
    ok(res, users, { page, per_page: limit, total: users.length, total_pages: 1 })
  })

  // PATCH /admin/users/:id
  router.patch('/users/:id', requireRole('admin'), async (req: Request, res: Response) => {
    const updated = await service.updateUser(req.user!.sub, param(req, 'id'), req.body)
    ok(res, updated)
  })

  // GET /admin/audit-logs
  router.get('/audit-logs', requireRole('admin'), async (req: Request, res: Response) => {
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>)
    const logs = await service.getAuditLogs({ limit, offset })
    ok(res, logs)
  })

  return router
}
