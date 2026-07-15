import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../lib/validate'
import { ok, created, noContent } from '../../lib/response'
import { param } from '../../lib/param'
import { createListingSchema, updateListingSchema, listingsQuerySchema } from './listing.dto'
import type { ListingsQuery } from './listing.dto'
import { getListingStats } from './listing.stats'
import type { ListingService } from './listing.service'

export function listingRouter(service: ListingService): Router {
  const router = Router()

  // GET /listings/stats — public, cached-friendly
  router.get('/stats', async (_req: Request, res: Response) => {
    const stats = await getListingStats()
    ok(res, stats)
  })

  router.get('/', validate(listingsQuerySchema, 'query'), async (req: Request, res: Response) => {
    const query = (req as unknown as Record<string, unknown>)['parsedQuery'] as ListingsQuery
    const { data, meta } = await service.list(query)
    ok(res, data, meta)
  })

  router.get('/:id', async (req: Request, res: Response) => {
    ok(res, await service.getById(param(req, 'id')))
  })

  router.post('/', requireAuth, validate(createListingSchema), async (req: Request, res: Response) => {
    created(res, await service.create(req.user!.sub, req.body))
  })

  router.patch('/:id', requireAuth, validate(updateListingSchema), async (req: Request, res: Response) => {
    ok(res, await service.update(param(req, 'id'), req.user!.sub, req.user!.role, req.body))
  })

  router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    await service.delete(param(req, 'id'), req.user!.sub, req.user!.role)
    noContent(res)
  })

  return router
}
