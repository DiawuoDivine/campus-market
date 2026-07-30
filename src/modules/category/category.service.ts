import { AppError } from '../../lib/appError'
import type { CategoryRepository } from './category.repository'
import type { CreateCategoryDto } from './category.dto'

export class CategoryService {
  constructor(private readonly repo: CategoryRepository) {}

  async listAll() {
    return this.repo.findAll()
  }

  async getById(id: string) {
    const cat = await this.repo.findById(id)
    if (!cat) throw AppError.notFound('Category')
    return cat
  }

  async create(dto: CreateCategoryDto) {
    return this.repo.create(dto)
  }

  async delete(id: string) {
    const cat = await this.repo.findById(id)
    if (!cat) throw AppError.notFound('Category')
    await this.repo.delete(id)
  }
}
