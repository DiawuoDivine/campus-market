import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth'
import { validate } from '../../lib/validate'
import { ok, created, noContent } from '../../lib/response'
import { param } from '../../lib/param'
import { createCategorySchema } from './category.dto'
import type { CategoryService } from './category.service'

export function categoryRouter(service: CategoryService): Router {
  const router = Router()

  router.get('/', async (_req: Request, res: Response) => {
    ok(res, await service.listAll())
  })

  router.get('/:id', async (req: Request, res: Response) => {
    ok(res, await service.getById(param(req, 'id')))
  })

  router.post('/', requireAuth, requireRole('admin'), validate(createCategorySchema), async (req: Request, res: Response) => {
    created(res, await service.create(req.body))
  })

  router.delete('/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    await service.delete(param(req, 'id'))
    noContent(res)
  })

  return router
}
