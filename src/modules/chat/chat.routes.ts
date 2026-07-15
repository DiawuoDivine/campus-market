import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../lib/validate'
import { ok, created } from '../../lib/response'
import { param } from '../../lib/param'
import { startConversationSchema, sendMessageSchema } from './chat.dto'
import type { ChatService } from './chat.service'

export function chatRouter(service: ChatService): Router {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (req: Request, res: Response) => {
    ok(res, await service.getConversations(req.user!.sub))
  })

  router.post('/', validate(startConversationSchema), async (req: Request, res: Response) => {
    created(res, await service.startConversation(req.user!.sub, req.body))
  })

  router.get('/:id/messages', async (req: Request, res: Response) => {
    ok(res, await service.getMessages(param(req, 'id'), req.user!.sub))
  })

  router.post('/:id/messages', validate(sendMessageSchema), async (req: Request, res: Response) => {
    created(res, await service.sendMessage(param(req, 'id'), req.user!.sub, req.body))
  })

  return router
}
