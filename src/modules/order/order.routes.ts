import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../lib/validate'
import { ok, created } from '../../lib/response'
import { param } from '../../lib/param'
import { createOrderSchema, updateOrderStatusSchema } from './order.dto'
import type { OrderService } from './order.service'

export function orderRouter(service: OrderService): Router {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (req: Request, res: Response) => {
    ok(res, await service.getMyOrders(req.user!.sub))
  })

  router.get('/:id', async (req: Request, res: Response) => {
    ok(res, await service.getById(param(req, 'id'), req.user!.sub))
  })

  router.post('/', validate(createOrderSchema), async (req: Request, res: Response) => {
    created(res, await service.create(req.user!.sub, req.body))
  })

  router.patch('/:id/status', validate(updateOrderStatusSchema), async (req: Request, res: Response) => {
    ok(res, await service.updateStatus(param(req, 'id'), req.user!.sub, req.body))
  })

  return router
}
