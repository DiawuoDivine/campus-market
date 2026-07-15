import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDTO } from '../lib/types'

interface AuthState {
  user: UserDTO | null
  accessToken: string | null
  setAuth: (user: UserDTO, token: string) => void
  clearAuth: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        localStorage.setItem('access_token', accessToken)
        set({ user, accessToken })
      },
      clearAuth: () => {
        localStorage.removeItem('access_token')
        set({ user: null, accessToken: null })
      },
      isLoggedIn: () => Boolean(get().accessToken),
    }),
    { name: 'campus-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken }) },
  ),
)
