import { AppError } from '../../lib/appError'
import { buildMeta } from '../../lib/pagination'
import type { ListingRepository } from './listing.repository'
import type { CreateListingDto, UpdateListingDto, ListingsQuery } from './listing.dto'

export class ListingService {
  constructor(private readonly repo: ListingRepository) {}

  async list(query: ListingsQuery) {
    const { data, total } = await this.repo.findMany(query)
    const meta = buildMeta(query.page, query.limit, total)
    return { data, meta }
  }

  async getById(id: string) {
    const listing = await this.repo.findById(id)
    if (!listing) throw AppError.notFound('Listing')
    await this.repo.incrementViewCount(id)
    return listing
  }

  async create(sellerId: string, dto: CreateListingDto) {
    return this.repo.create(sellerId, dto)
  }

  async update(id: string, requesterId: string, requesterRole: string, dto: UpdateListingDto) {
    const listing = await this.repo.findById(id)
    if (!listing) throw AppError.notFound('Listing')
    if (listing.sellerId !== requesterId && requesterRole !== 'admin') {
      throw AppError.forbidden('You do not own this listing')
    }
    return this.repo.update(id, dto)
  }

  async delete(id: string, requesterId: string, requesterRole: string) {
    const listing = await this.repo.findById(id)
    if (!listing) throw AppError.notFound('Listing')
    if (listing.sellerId !== requesterId && requesterRole !== 'admin') {
      throw AppError.forbidden('You do not own this listing')
    }
    await this.repo.delete(id)
  }
}
