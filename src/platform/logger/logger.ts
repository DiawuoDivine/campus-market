import pino from 'pino'
import { env } from '../../config/env'

/**
 * Plain pino logger — no transport/worker threads.
 * Writes JSON to stdout directly. Works reliably on Bun for Windows.
 * Pipe through `pino-pretty` externally if you want formatted output:
 *   bun run dev | bunx pino-pretty
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
})
