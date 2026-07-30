import { eq } from 'drizzle-orm'
import { getDb } from '../../platform/database/client'
import { categories } from '../../platform/database/schema'
import type { CreateCategoryDto, UpdateCategoryDto } from './category.dto'

export class CategoryRepository {
  get db() { return getDb() }

  async findAll() {
    return this.db.select().from(categories).orderBy(categories.name)
  }

  async findById(id: string) {
    const result = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1)
    return result[0] ?? null
  }

  async create(data: CreateCategoryDto) {
    const result = await this.db.insert(categories).values(data).returning()
    return result[0]!
  }

  async delete(id: string) {
    await this.db.delete(categories).where(eq(categories.id, id))
  }

  async update(id: string, data: UpdateCategoryDto) {
    await this.db.update(categories).set(data).where(eq(categories.id, id))
    return this.findById(id)
  }

  async delete(id: string) {
    await this.db.delete(categories).where(eq(categories.id, id))
  }
}
