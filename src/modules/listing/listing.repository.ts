import { eq, and, gte, lte, desc, asc, sql, inArray, like } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import { listings, listingImages, users, categories } from '../../platform/database/schema'
import type { CreateListingDto, UpdateListingDto, ListingsQuery } from './listing.dto'

export class ListingRepository {
  get db() {
    return getDb()
  }

  async findMany(query: ListingsQuery) {
    const conditions = [eq(listings.status, 'published')]

    if (query.category_id) conditions.push(eq(listings.categoryId, query.category_id))
    if (query.condition) conditions.push(eq(listings.condition, query.condition))
    if (query.min_price !== undefined) conditions.push(gte(listings.price, query.min_price))
    if (query.max_price !== undefined) conditions.push(lte(listings.price, query.max_price))
    if (query.seller_id) conditions.push(eq(listings.sellerId, query.seller_id))
    if (query.search) {
      const term = `%${query.search}%`
      // SQLite uses LIKE (case-insensitive for ASCII by default)
      conditions.push(
        sql`(${listings.title} LIKE ${term} OR ${listings.description} LIKE ${term})`,
      )
    }

    const orderBy =
      query.sort === 'price_asc'
        ? asc(listings.price)
        : query.sort === 'price_desc'
          ? desc(listings.price)
          : query.sort === 'popular'
            ? desc(listings.viewCount)
            : desc(listings.createdAt)

    const offset = (query.page - 1) * query.limit

    const rows = await this.db
      .select({
        listing: listings,
        seller: {
          id: users.id,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          campus: users.campus,
          isVerified: users.isVerified,
          ratingAvg: users.ratingAvg,
          ratingCount: users.ratingCount,
        },
        category: categories,
      })
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(offset)

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(and(...conditions))

    const total = Number(countResult[0]?.count ?? 0)
    const ids = rows.map((r) => r.listing.id)

    const images =
      ids.length > 0
        ? await this.db.select().from(listingImages).where(inArray(listingImages.listingId, ids))
        : []

    const imageMap = new Map<string, typeof images>()
    for (const img of images) {
      const list = imageMap.get(img.listingId) ?? []
      list.push(img)
      imageMap.set(img.listingId, list)
    }

    return {
      data: rows.map((r) => ({
        ...r.listing,
        seller: r.seller,
        category: r.category,
        images: imageMap.get(r.listing.id) ?? [],
      })),
      total,
    }
  }

  async findById(id: string) {
    const result = await this.db
      .select({
        listing: listings,
        seller: {
          id: users.id,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          campus: users.campus,
          isVerified: users.isVerified,
          ratingAvg: users.ratingAvg,
          ratingCount: users.ratingCount,
        },
        category: categories,
      })
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .where(eq(listings.id, id))
      .limit(1)

    if (!result[0]) return null
    const images = await this.db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, id))
      .orderBy(asc(listingImages.position))

    return {
      ...result[0].listing,
      seller: result[0].seller,
      category: result[0].category,
      images,
    }
  }

  async create(sellerId: string, data: CreateListingDto) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await this.db.insert(listings).values({
      id,
      sellerId,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      price: data.price,
      condition: data.condition,
      quantity: data.quantity,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    })

    if (data.images?.length) {
      await this.db.insert(listingImages).values(
        data.images.map((img) => ({
          id: crypto.randomUUID(),
          listingId: id,
          url: img.url,
          position: img.position,
          isPrimary: img.isPrimary,
        })),
      )
    }

    return (await this.findById(id))!
  }

  async update(id: string, data: UpdateListingDto) {
    const { images: _images, ...rest } = data
    await this.db
      .update(listings)
      .set({ ...rest, updatedAt: new Date().toISOString() })
      .where(eq(listings.id, id))
    return this.findById(id)
  }

  async delete(id: string) {
    await this.db.delete(listings).where(eq(listings.id, id))
  }

  async incrementViewCount(id: string) {
    await this.db
      .update(listings)
      .set({ viewCount: sql`${listings.viewCount} + 1` })
      .where(eq(listings.id, id))
  }
}
