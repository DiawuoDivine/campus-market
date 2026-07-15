import { SignJWT, jwtVerify } from 'jose'
import { env } from '../config/env'

export interface JwtPayload {
  sub: string       // user id
  role: string
  iat?: number
  exp?: number
}

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET)
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET)

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/)
  if (!match) throw new Error(`Invalid duration: ${duration}`)
  const value = parseInt(match[1]!)
  const unit = match[2]
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }
  return value * (multipliers[unit!] ?? 1)
}

export async function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${parseDuration(env.JWT_ACCESS_EXPIRES_IN)}s`)
    .sign(accessSecret)
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${parseDuration(env.JWT_REFRESH_EXPIRES_IN)}s`)
    .sign(refreshSecret)
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, accessSecret)
  return payload as unknown as JwtPayload
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, refreshSecret)
  return { sub: payload.sub as string }
}
