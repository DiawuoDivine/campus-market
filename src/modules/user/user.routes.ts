import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../lib/validate'
import { ok } from '../../lib/response'
import { param } from '../../lib/param'
import { updateProfileSchema } from './user.dto'
import type { UserService } from './user.service'

export function userRouter(service: UserService): Router {
  const router = Router()

  router.get('/me', requireAuth, async (req: Request, res: Response) => {
    ok(res, await service.getProfile(req.user!.sub))
  })

  router.patch('/me', requireAuth, validate(updateProfileSchema), async (req: Request, res: Response) => {
    ok(res, await service.updateProfile(req.user!.sub, req.body))
  })

  router.get('/:id', async (req: Request, res: Response) => {
    ok(res, await service.getProfile(param(req, 'id')))
  })

  return router
}
