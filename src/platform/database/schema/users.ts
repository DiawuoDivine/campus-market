import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  indexNumber: text('index_number').unique().notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  campus: text('campus'),
  hostel: text('hostel'),
  bio: text('bio'),
  role: text('role', { enum: ['student', 'moderator', 'admin'] }).notNull().default('student'),
  status: text('status', { enum: ['pending_verification', 'active', 'suspended', 'banned'] }).notNull().default('active'),
  isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
  ratingAvg: real('rating_avg').notNull().default(0),
  ratingCount: integer('rating_count').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const verifiedStudents = sqliteTable('verified_students', {
  indexNumber: text('index_number').primaryKey(),
  fullName: text('full_name').notNull(),
  program: text('program'),
  enrollmentYear: integer('enrollment_year'),
  importedAt: text('imported_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  deviceInfo: text('device_info'),
  expiresAt: text('expires_at').notNull(),
  revokedAt: text('revoked_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
