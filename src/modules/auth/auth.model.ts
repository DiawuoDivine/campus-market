export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  fullName: string
  email: string
  indexNumber: string
  role: string
  isVerified: boolean
}
