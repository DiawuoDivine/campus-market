import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../lib/validate'
import { ok, created } from '../../lib/response'
import { param } from '../../lib/param'
import { createReviewSchema } from './review.dto'
import type { ReviewService } from './review.service'

export function reviewRouter(service: ReviewService): Router {
  const router = Router()

  router.get('/users/:userId', async (req: Request, res: Response) => {
    ok(res, await service.getForUser(param(req, 'userId')))
  })

  router.post('/', requireAuth, validate(createReviewSchema), async (req: Request, res: Response) => {
    created(res, await service.create(req.user!.sub, req.body))
  })

  return router
}
