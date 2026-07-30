import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { resolve as resolvePath } from 'path'
import { mkdirSync } from 'fs'
import { env } from '../config/env'
import { requestLogger } from '../middleware/requestLogger'
import { errorHandler } from '../middleware/errorHandler'
import { registerRoutes } from './routes'

export function createApp() {
  const app = express()

  // Security headers
  app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }))

  // CORS — allow the Vite dev server and any configured origin
  app.use(
    cors({
      origin: [ 'https://campus-market-nu-orcin.vercel.app', 'http://localhost:5174'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )                                        
  app.use(express.json({ limit: '5mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Request logging
  app.use(requestLogger)

  // Global rate limit on all /api routes
  app.use(
    '/api',
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        data: null,
        error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down.' },
      },
    }),
  )

  // Health checks
  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }))
  app.get('/readyz', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  )

  // Serve uploaded files statically
  const uploadsDir = resolvePath(process.cwd(), 'data/uploads')
  mkdirSync(uploadsDir, { recursive: true })
  app.use('/uploads', express.static(uploadsDir))

  // API routes
  registerRoutes(app)

  // 404 for unmatched API routes
  app.use('/api', (_req, res) => {
    res.status(404).json({
      success: false,
      data: null,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    })
  })

  // Central error handler — must be last
  app.use(errorHandler)

  return app
}
