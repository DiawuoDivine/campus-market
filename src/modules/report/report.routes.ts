import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth'
import { validate } from '../../lib/validate'
import { ok, created } from '../../lib/response'
import { param } from '../../lib/param'
import { z } from 'zod'
import type { ReportService } from './report.service'

const createReportSchema = z.object({
  targetType: z.enum(['listing', 'user']),
  targetId:   z.string().uuid(),
  reason:     z.string().min(5).max(500),
})

const updateReportSchema = z.object({
  status: z.enum(['reviewed', 'dismissed', 'actioned']),
  action: z.enum(['none', 'remove_listing', 'suspend_user', 'ban_user']).optional(),
  note:   z.string().max(500).optional(),
})

export function reportRouter(service: ReportService): Router {
  const router = Router()

  // GET /reports  (admin + moderator)
  router.get('/', requireAuth, requireRole('admin', 'moderator'), async (req: Request, res: Response) => {
    const page  = parseInt(String(req.query['page']  ?? '1'))  || 1
    const limit = parseInt(String(req.query['limit'] ?? '50')) || 50
    const status = req.query['status'] as string | undefined
    const data = await service.list({ status, limit, offset: (page - 1) * limit })
    ok(res, data)
  })

  // POST /reports  (authenticated students)
  router.post('/', requireAuth, validate(createReportSchema), async (req: Request, res: Response) => {
    const report = await service.create(req.user!.sub, req.body)
    created(res, report)
  })

  // PATCH /reports/:id  (admin + moderator)
  router.patch(
    '/:id',
    requireAuth,
    requireRole('admin', 'moderator'),
    validate(updateReportSchema),
    async (req: Request, res: Response) => {
      const updated = await service.resolve(req.user!.sub, param(req, 'id'), req.body)
      ok(res, updated)
    },
  )

  return router
}
