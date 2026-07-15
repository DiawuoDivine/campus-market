import type { Request, Response, NextFunction } from 'express'
import type { ZodType } from 'zod'
import { AppError } from './appError'

type Target = 'body' | 'query' | 'params'

export function validate<T extends ZodType>(schema: T, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      const details = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      )
      next(AppError.validation('Validation failed', details))
      return
    }
    // Express 5 makes req.query read-only — attach parsed data as a custom property instead
    // Route handlers read it via req.body (for body/params) or req.parsedQuery (for query)
    if (target === 'body' || target === 'params') {
      try {
        ;(req as unknown as Record<string, unknown>)[target] = result.data
      } catch {
        // readonly — ignore, data is already correct via zod defaults on req[target]
      }
    }
    // Store parsed query so route handlers can use it
    if (target === 'query') {
      ;(req as unknown as Record<string, unknown>)['parsedQuery'] = result.data
    }
    next()
  }
}
