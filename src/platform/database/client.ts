import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { mkdirSync } from 'fs'
import { resolve } from 'path'
import * as schema from './schema'

const DATA_DIR = resolve(process.cwd(), 'data')
const DB_PATH = resolve(DATA_DIR, 'campus-market.sqlite')

// Ensure the data directory exists
mkdirSync(DATA_DIR, { recursive: true })

let _db: ReturnType<typeof drizzle> | null = null
let _sqlite: Database | null = null

export function getDb() {
  if (!_db) {
    _sqlite = new Database(DB_PATH, { create: true })
    // Enable WAL mode for better concurrent read performance
    _sqlite.exec('PRAGMA journal_mode=WAL;')
    _sqlite.exec('PRAGMA foreign_keys=ON;')
    _db = drizzle(_sqlite, { schema })
  }
  return _db
}

export function closeDb() {
  _sqlite?.close()
  _db = null
  _sqlite = null
}
