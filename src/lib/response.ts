import type { Response } from 'express'

export interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  meta?: Record<string, unknown>
  error: { code: string; message: string; details?: string[] } | null
}

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>, status = 200): Response {
  return res.status(status).json({
    success: true,
    data,
    meta: meta,
    error: null,
  } satisfies ApiEnvelope<T>)
}

export function created<T>(res: Response, data: T): Response {
  return ok(res, data, undefined, 201)
}

export function noContent(res: Response): Response {
  return res.status(204).send()
}

export function fail(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: string[],
): Response {
  return res.status(status).json({
    success: false,
    data: null,
    error: { code, message, details },
  } satisfies ApiEnvelope<never>)
}
