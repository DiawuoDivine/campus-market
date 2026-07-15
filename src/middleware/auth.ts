import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'
import { AppError } from '../lib/appError'

declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; role: string }
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next(AppError.unauthorized())
    return
  }
  try {
    const payload = await verifyAccessToken(header.slice(7))
    req.user = { sub: payload.sub, role: payload.role }
    next()
  } catch {
    next(AppError.unauthorized('Invalid or expired token'))
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) { next(AppError.unauthorized()); return }
    if (!roles.includes(req.user.role)) { next(AppError.forbidden()); return }
    next()
  }
}
