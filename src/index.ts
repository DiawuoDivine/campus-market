import { createApp } from './server/app'
import { setupGracefulShutdown } from './server/shutdown'
import { logger } from './platform/logger/logger'
import { env } from './config/env'

const app = createApp()

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Campus Marketplace API running on http://localhost:${env.PORT}`)
  logger.info(`   Environment: ${env.NODE_ENV}`)
  logger.info(`   API base:    http://localhost:${env.PORT}/api/v1`)
})

setupGracefulShutdown(server)
