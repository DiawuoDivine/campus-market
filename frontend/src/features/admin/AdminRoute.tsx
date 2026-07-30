import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn } = useAuthStore()

  if (!isLoggedIn()) return <Navigate to="/login" replace />
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export function isAdminOrModerator(role?: string) {
  return role === 'admin' || role === 'moderator'
}
