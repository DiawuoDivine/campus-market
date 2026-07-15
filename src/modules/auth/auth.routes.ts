import { Router } from 'express'
import type { Request, Response } from 'express'
import { validate } from '../../lib/validate'
import { ok, created } from '../../lib/response'
import { loginSchema, refreshSchema, registerSchema } from './auth.dto'
import type { AuthService } from './auth.service'

export function authRouter(service: AuthService): Router {
  const router = Router()

  // POST /auth/register
  router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
    const deviceInfo = req.headers['user-agent']
    const { tokens, user } = await service.register(req.body, deviceInfo)
    created(res, { user, ...tokens })
  })

  // POST /auth/login
  router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
    const deviceInfo = req.headers['user-agent']
    const { tokens, user } = await service.login(req.body, deviceInfo)
    ok(res, { user, ...tokens })
  })

  // POST /auth/refresh
  router.post('/refresh', validate(refreshSchema), async (req: Request, res: Response) => {
    const deviceInfo = req.headers['user-agent']
    const tokens = await service.refresh(req.body.refreshToken, deviceInfo)
    ok(res, tokens)
  })

  // POST /auth/logout
  router.post('/logout', validate(refreshSchema), async (req: Request, res: Response) => {
    await service.logout(req.body.refreshToken)
    ok(res, { message: 'Logged out successfully' })
  })

  return router
}
