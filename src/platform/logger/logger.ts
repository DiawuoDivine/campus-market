import pino from 'pino'
import { env } from '../../config/env'

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  // pino-pretty is optional — falls back to JSON in dev if not installed
  ...(env.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino/file',
          options: { destination: 1 }, // stdout
        },
      }
    : {}),
})
