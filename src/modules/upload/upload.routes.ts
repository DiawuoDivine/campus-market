import { Router } from 'express'
import type { Request, Response } from 'express'
import multer from 'multer'
import { mkdirSync } from 'fs'
import { resolve, extname } from 'path'
import { requireAuth } from '../../middleware/auth'
import { ok } from '../../lib/response'
import { AppError } from '../../lib/appError'

const UPLOAD_DIR = resolve(process.cwd(), 'data/uploads')
mkdirSync(UPLOAD_DIR, { recursive: true })

// Allowed MIME types
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png',
  'image/webp', 'image/gif',
])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${crypto.randomUUID()}${extname(file.originalname).toLowerCase()}`
    cb(null, unique)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB per file
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`))
    }
  },
})

export function uploadRouter(): Router {
  const router = Router()

  /**
   * POST /upload
   * Body: multipart/form-data with field "file" (single) or "files" (up to 10)
   * Returns: { url } or { urls }
   */
  router.post(
    '/',
    requireAuth,
    (req: Request, res: Response, next) => {
      // Accept either single "file" or multiple "files"
      const handler = upload.fields([
        { name: 'file',  maxCount: 1  },
        { name: 'files', maxCount: 10 },
      ])
      handler(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return next(AppError.validation(err.message))
        }
        if (err) return next(AppError.validation((err as Error).message))
        next()
      })
    },
    (req: Request, res: Response) => {
      const fields = req.files as Record<string, Express.Multer.File[]> | undefined
      const singleFiles  = fields?.['file']  ?? []
      const multiFiles   = fields?.['files'] ?? []
      const all = [...singleFiles, ...multiFiles]

      if (all.length === 0) {
        throw AppError.badRequest('No file uploaded')
      }

      // Build public URLs — served via /uploads/* static route
      const BASE = process.env['API_BASE_URL'] ?? `http://localhost:${process.env['PORT'] ?? 8080}`
      const urls = all.map((f) => `${BASE}/uploads/${f.filename}`)

      if (all.length === 1) {
        ok(res, { url: urls[0], filename: all[0]!.filename })
      } else {
        ok(res, { urls, filenames: all.map((f) => f.filename) })
      }
    },
  )

  return router
}
