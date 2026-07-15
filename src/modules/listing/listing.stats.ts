import { sql, eq } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import { listings, users, categories } from '../../platform/database/schema'

export async function getListingStats() {
  const db = getDb()

  const [totals, categoryBreakdown, recentCount] = await Promise.all([
    // Overall counts by status
    db
      .select({
        status: listings.status,
        count: sql<number>`count(*)`,
      })
      .from(listings)
      .groupBy(listings.status),

    // Top categories by listing count
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        count: sql<number>`count(${listings.id})`,
      })
      .from(categories)
      .leftJoin(listings, eq(listings.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(sql`count(${listings.id}) desc`)
      .limit(8),

    // Listings added in the last 7 days
    db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(
        sql`${listings.createdAt} >= datetime('now', '-7 days')`,
      ),
  ])

  const [totalUsers] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)

  const published = totals.find((r) => r.status === 'published')?.count ?? 0
  const sold      = totals.find((r) => r.status === 'sold')?.count ?? 0

  return {
    totalListings:    Number(published),
    totalSold:        Number(sold),
    totalUsers:       Number(totalUsers?.count ?? 0),
    newThisWeek:      Number(recentCount[0]?.count ?? 0),
    topCategories:    categoryBreakdown.map((c) => ({ ...c, count: Number(c.count) })),
  }
}
