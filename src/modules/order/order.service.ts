import { AppError } from '../../lib/appError'
import type { OrderRepository } from './order.repository'
import type { ListingRepository } from '../listing/listing.repository'
import type { CreateOrderDto, UpdateOrderStatusDto } from './order.dto'

export class OrderService {
  constructor(
    private readonly repo: OrderRepository,
    private readonly listingRepo: ListingRepository,
  ) {}

  async getMyOrders(userId: string) {
    return this.repo.findByUser(userId)
  }

  async getById(id: string, userId: string) {
    const order = await this.repo.findById(id)
    if (!order) throw AppError.notFound('Order')
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw AppError.forbidden()
    }
    return order
  }

  async create(buyerId: string, dto: CreateOrderDto) {
    const listing = await this.listingRepo.findById(dto.listingId)
    if (!listing) throw AppError.notFound('Listing')
    if (listing.sellerId === buyerId) throw AppError.badRequest('Cannot buy your own listing')
    return this.repo.create(buyerId, listing.sellerId, dto)
  }

  async updateStatus(id: string, userId: string, dto: UpdateOrderStatusDto) {
    const order = await this.repo.findById(id)
    if (!order) throw AppError.notFound('Order')

    const isSeller = order.sellerId === userId
    const isBuyer = order.buyerId === userId

    if (dto.status === 'accepted' || dto.status === 'declined') {
      if (!isSeller) throw AppError.forbidden('Only the seller can accept or decline')
    } else if (dto.status === 'completed') {
      if (!isBuyer && !isSeller) throw AppError.forbidden()
    } else if (dto.status === 'cancelled') {
      if (!isBuyer) throw AppError.forbidden('Only the buyer can cancel')
    }

    return this.repo.updateStatus(id, dto.status)
  }
}
