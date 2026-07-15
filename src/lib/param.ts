import type { Request } from 'express'

/** Safely extract a route param as a string (Express 5 types it as string | string[]) */
export function param(req: Request, name: string): string {
  const v = req.params[name]
  if (Array.isArray(v)) return v[0] ?? ''
  return v ?? ''
}
