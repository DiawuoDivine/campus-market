import type { ReviewRepository } from './review.repository'
import type { CreateReviewDto } from './review.dto'

export class ReviewService {
  constructor(private readonly repo: ReviewRepository) {}

  async getForUser(userId: string) {
    return this.repo.findByReviewee(userId)
  }

  async create(reviewerId: string, dto: CreateReviewDto) {
    return this.repo.create(reviewerId, dto)
  }
}
