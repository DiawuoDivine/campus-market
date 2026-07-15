import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { listings } from './listings'

export const favorites = sqliteTable('favorites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: text('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const savedSearches = sqliteTable('saved_searches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  queryParams: text('query_params').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId: text('listing_id'),
  buyerId: text('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: text('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  attachmentUrl: text('attachment_url'),
  readAt: text('read_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId: text('listing_id'),
  buyerId: text('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: text('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'] }).notNull().default('pending'),
  meetupLocation: text('meetup_location'),
  meetupTime: text('meetup_time'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  completedAt: text('completed_at'),
})

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id'),
  reviewerId: text('reviewer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  revieweeId: text('reviewee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['new_message', 'new_offer', 'offer_accepted', 'offer_declined', 'listing_sold', 'listing_expiring', 'review_received', 'moderation_action'] }).notNull(),
  payload: text('payload').notNull().default('{}'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  reporterId: text('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetType: text('target_type', { enum: ['listing', 'user'] }).notNull(),
  targetId: text('target_id').notNull(),
  reason: text('reason').notNull(),
  status: text('status', { enum: ['pending', 'reviewed', 'dismissed', 'actioned'] }).notNull().default('pending'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const adminAuditLogs = sqliteTable('admin_audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  adminId: text('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  meta: text('meta').default('{}'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
