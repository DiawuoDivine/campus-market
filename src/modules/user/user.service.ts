import { AppError } from '../../lib/appError'
import type { UserRepository } from './user.repository'
import type { UpdateProfileDto } from './user.dto'

export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async getProfile(id: string) {
    const user = await this.repo.findById(id)
    if (!user) throw AppError.notFound('User')
    return this.#sanitize(user)
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.repo.update(id, dto)
    if (!user) throw AppError.notFound('User')
    return this.#sanitize(user)
  }

  #sanitize(user: Record<string, unknown>) {
    const { passwordHash: _pw, ...safe } = user as { passwordHash: string; [k: string]: unknown }
    return safe
  }
}
