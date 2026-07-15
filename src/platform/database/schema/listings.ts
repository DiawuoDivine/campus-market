import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { users } from './users'

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
})

export const listings = sqliteTable('listings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId: text('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: text('category_id'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(),                  // in pesewas
  condition: text('condition', { enum: ['new', 'like_new', 'used', 'fair', 'poor'] }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  status: text('status', { enum: ['draft', 'published', 'sold', 'archived'] }).notNull().default('published'),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  expiresAt: text('expires_at'),
})

export const listingImages = sqliteTable('listing_images', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId: text('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: integer('position').notNull().default(0),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
})
