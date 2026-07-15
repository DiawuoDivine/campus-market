import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth'
import { ok } from '../../lib/response'
import { FavoriteRepository } from './favorite.repository'

export function favoriteRouter(): Router {
  const router = Router()
  const repo = new FavoriteRepository()
  router.use(requireAuth)

  router.get('/', async (req: Request, res: Response) => {
    ok(res, await repo.findByUser(req.user!.sub))
  })

  router.post('/', async (req: Request, res: Response) => {
    const { listing_id } = req.body as { listing_id: string }
    ok(res, await repo.toggle(req.user!.sub, listing_id))
  })

  return router
}
