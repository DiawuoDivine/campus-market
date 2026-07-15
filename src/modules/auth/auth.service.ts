import crypto from 'crypto'
import { hashPassword, verifyPassword } from '../../lib/hash'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt'
import { normalizeIndexNumber } from '../../lib/indexNumber'
import { AppError } from '../../lib/appError'
import { env } from '../../config/env'
import type { IAuthRepository } from './auth.repository'
import type { RegisterDto, LoginDto } from './auth.dto'
import type { AuthTokens, AuthUser } from './auth.model'

export class AuthService {
  constructor(private readonly repo: IAuthRepository) {}

  async register(dto: RegisterDto, deviceInfo?: string): Promise<{ tokens: AuthTokens; user: AuthUser }> {
    const indexNumber = normalizeIndexNumber(dto.indexNumber)

    const existing = await this.repo.findUserByIdentifier(dto.email)
    if (existing) throw AppError.conflict('An account with this email already exists')

    const existingIndex = await this.repo.findUserByIdentifier(indexNumber)
    if (existingIndex) throw AppError.conflict('This student index number is already registered')

    const passwordHash = await hashPassword(dto.password)
    const user = await this.repo.createUser({
      fullName: dto.fullName,
      indexNumber,
      email: dto.email,
      passwordHash,
    })

    const tokens = await this.#issueTokens(user.id, user.role, deviceInfo)

    return {
      tokens,
      user: this.#toAuthUser(user),
    }
  }

  async login(dto: LoginDto, deviceInfo?: string): Promise<{ tokens: AuthTokens; user: AuthUser }> {
    const user = await this.repo.findUserByIdentifier(dto.identifier)
    if (!user) throw AppError.unauthorized('Invalid credentials')

    const valid = await verifyPassword(dto.password, user.passwordHash)
    if (!valid) throw AppError.unauthorized('Invalid credentials')

    if (user.status === 'suspended' || user.status === 'banned') {
      throw AppError.forbidden('Your account has been suspended')
    }

    const tokens = await this.#issueTokens(user.id, user.role, deviceInfo)
    return { tokens, user: this.#toAuthUser(user) }
  }

  async refresh(refreshToken: string, deviceInfo?: string): Promise<AuthTokens> {
    const tokenHash = this.#hashToken(refreshToken)
    const session = await this.repo.findSession(tokenHash)

    if (!session || session.revokedAt || new Date(session.expiresAt) < new Date()) {
      throw AppError.unauthorized('Invalid or expired refresh token')
    }

    // Rotate: revoke old, issue new
    await this.repo.revokeSession(tokenHash)

    let payload: { sub: string }
    try {
      payload = await verifyRefreshToken(refreshToken)
    } catch {
      throw AppError.unauthorized('Invalid refresh token')
    }

    const user = await this.repo.findUserById(payload.sub)
    if (!user) throw AppError.unauthorized('User not found')

    return this.#issueTokens(user.id, user.role, deviceInfo)
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.#hashToken(refreshToken)
    await this.repo.revokeSession(tokenHash)
  }

  async #issueTokens(userId: string, role: string, deviceInfo?: string): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: userId, role }),
      signRefreshToken(userId),
    ])

    const expiresInDays = parseInt(env.JWT_REFRESH_EXPIRES_IN) || 7
    const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000)
    await this.repo.saveRefreshToken(userId, this.#hashToken(refreshToken), expiresAt, deviceInfo)

    return { accessToken, refreshToken }
  }

  #hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  #toAuthUser(user: { id: string; fullName: string; email: string; indexNumber: string; role: string; isVerified: boolean }): AuthUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      indexNumber: user.indexNumber,
      role: user.role,
      isVerified: user.isVerified,
    }
  }
}
