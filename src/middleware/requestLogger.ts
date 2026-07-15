import pinoHttp from 'pino-http'
import { logger } from '../platform/logger/logger'

export const requestLogger = pinoHttp({ logger })
