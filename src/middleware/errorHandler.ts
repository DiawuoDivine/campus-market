import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/appError'
import { logger } from '../platform/logger/logger'

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      data: null,
      error: { code: err.code, message: err.message, details: err.details },
    })
    return
  }

  // Zod errors or unknown
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error')
  res.status(500).json({
    success: false,
    data: null,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  })
}
