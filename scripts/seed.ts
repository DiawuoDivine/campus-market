/**
 * Local development seed — run with: bun run db:seed
 * Safe to run multiple times (skips rows that already exist).
 */
import { getDb, closeDb } from '../src/platform/database/client'
import { categories, users, listings, listingImages } from '../src/platform/database/schema'
import { hashPassword } from '../src/lib/hash'
import { eq } from 'drizzle-orm'

const db = getDb()

async function seed() {
  console.log('🌱 Seeding SQLite database…')
  const now = new Date().toISOString()

  // ── Categories ──────────────────────────────────────────────────
  const catDefs = [
    { name: 'Electronics',   slug: 'electronics',  icon: 'laptop' },
    { name: 'Textbooks',     slug: 'textbooks',    icon: 'book' },
    { name: 'Fashion',       slug: 'fashion',      icon: 'shirt' },
    { name: 'Furniture',     slug: 'furniture',    icon: 'sofa' },
    { name: 'Sports',        slug: 'sports',       icon: 'dumbbell' },
    { name: 'Services',      slug: 'services',     icon: 'wrench' },
    { name: 'Lost & Found',  slug: 'lost-found',   icon: 'search' },
    { name: 'Food & Drinks', slug: 'food-drinks',  icon: 'utensils' },
  ]

  for (const cat of catDefs) {
    const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1)
    if (!existing[0]) {
      await db.insert(categories).values({ id: crypto.randomUUID(), ...cat })
    }
  }

  // Fetch IDs from DB (works whether we just inserted or they already existed)
  const allCats = await db.select().from(categories)
  const catMap = new Map(allCats.map((c) => [c.slug, c.id]))
  console.log(`✓ ${allCats.length} categories`)

  // ── Demo users ──────────────────────────────────────────────────
  const pw = await hashPassword('password123')

  const userDefs = [
    {
      indexNumber: '5223001234',
      email: 'ama@university.edu',
      fullName: 'Ama Mensah',
      campus: 'Main Campus',
      hostel: 'Unity Hall',
      ratingAvg: 4.7,
      ratingCount: 12,
    },
    {
      indexNumber: '5223005678',
      email: 'kofi@university.edu',
      fullName: 'Kofi Asante',
      campus: 'Main Campus',
      hostel: 'Mensah Sarbah Hall',
      ratingAvg: 4.2,
      ratingCount: 5,
    },
       {
      indexNumber: '5221040876',
      email: 'kofi@university.edu',
      fullName: 'Kofi Asante',
      campus: 'Main Campus',
      hostel: 'Mensah Sarbah Hall',
      ratingAvg: 4.2,
      ratingCount: 5,
    },
  ]

  for (const u of userDefs) {
    const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1)
    if (!existing[0]) {
      await db.insert(users).values({
        id: crypto.randomUUID(),
        passwordHash: pw,
        isVerified: true,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        ...u,
      })
    }
  }

  // Fetch IDs from DB
  const allUsers = await db.select().from(users)
  const userMap = new Map(allUsers.map((u) => [u.email, u.id]))
  console.log(`✓ ${allUsers.length} demo users`)

  const amaId  = userMap.get('ama@university.edu')!
  const kofiId = userMap.get('kofi@university.edu')!
  const electronicsId = catMap.get('electronics')!
  const textbooksId   = catMap.get('textbooks')!
  const fashionId     = catMap.get('fashion')!

  // ── Listings ────────────────────────────────────────────────────
  const listingDefs = [
    {
      sellerId: amaId,
      categoryId: electronicsId,
      title: 'HP EliteBook 840 G5 — Excellent Condition',
      description: 'Used for one semester. 16GB RAM, 512GB SSD, Intel i5. Comes with charger and bag. Perfect for engineering students.',
      price: 250000,
      condition: 'like_new' as const,
    },
    {
      sellerId: amaId,
      categoryId: textbooksId,
      title: 'Calculus: Early Transcendentals (8th Edition)',
      description: 'Stewart Calculus. Minor highlighting in first 3 chapters. Great for MATH 101/201.',
      price: 8000,
      condition: 'used' as const,
    },
    {
      sellerId: kofiId,
      categoryId: electronicsId,
      title: 'Samsung Galaxy Tab S6 Lite + S Pen',
      description: 'Great for note-taking. Includes original box and case. Android 13.',
      price: 120000,
      condition: 'like_new' as const,
    },
    {
      sellerId: kofiId,
      categoryId: textbooksId,
      title: 'Engineering Mathematics Bundle (4 books)',
      description: 'Bird, Kreyszig, Stroud, and Nagle. Covers years 1–3. Sold as a set.',
      price: 30000,
      condition: 'used' as const,
    },
    {
      sellerId: amaId,
      categoryId: fashionId,
      title: 'Brand new Adidas slides — Size 42',
      description: 'Bought wrong size. Never worn. Original receipt available.',
      price: 15000,
      condition: 'new' as const,
    },
  ]

  let inserted = 0
  for (const l of listingDefs) {
    // Skip if a listing with same title from same seller already exists
    const existing = await db
      .select()
      .from(listings)
      .where(eq(listings.title, l.title))
      .limit(1)
    if (existing[0]) continue

    const id = crypto.randomUUID()
    await db.insert(listings).values({
      id,
      quantity: 1,
      status: 'published',
      createdAt: now,
      updatedAt: now,
      ...l,
    })
    await db.insert(listingImages).values({
      id: crypto.randomUUID(),
      listingId: id,
      url: `https://picsum.photos/seed/${id}/600/400`,
      position: 0,
      isPrimary: true,
    })
    inserted++
  }

  console.log(`✓ ${inserted} new listings inserted`)
  console.log('\n✅  Seed complete!')
  console.log('   DB file: data/campus-market.sqlite')
  console.log('   Login:   ama@university.edu  /  password123')
  console.log('   Login:   kofi@university.edu /  password123')

  closeDb()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
