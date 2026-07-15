import type { Server } from 'http'
import { closeDb } from '../platform/database/client'
import { logger } from '../platform/logger/logger'

export function setupGracefulShutdown(server: Server) {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully…`)
    server.close(async () => {
      logger.info('HTTP server closed')
      await closeDb()
      logger.info('Database connections closed')
      process.exit(0)
    })
    // Force exit after 10s
    setTimeout(() => { logger.error('Forced shutdown after timeout'); process.exit(1) }, 10_000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}
