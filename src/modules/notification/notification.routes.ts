import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth'
import { ok, noContent } from '../../lib/response'
import { NotificationRepository } from './notification.repository'

export function notificationRouter(): Router {
  const router = Router()
  const repo = new NotificationRepository()
  router.use(requireAuth)

  router.get('/', async (req: Request, res: Response) => {
    ok(res, await repo.findByUser(req.user!.sub))
  })

  router.post('/read-all', async (req: Request, res: Response) => {
    await repo.markAllRead(req.user!.sub)
    noContent(res)
  })

  return router
}
