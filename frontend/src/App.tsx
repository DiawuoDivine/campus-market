import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import { Layout } from '@/components/shared/Layout'
import { HomePage } from '@/features/home/HomePage'
import { CatalogPage } from '@/features/listings/CatalogPage'
import { ListingDetailPage } from '@/features/listings/ListingDetailPage'
import { CreateListingPage } from '@/features/listings/CreateListingPage'
import { EditListingPage } from '@/features/listings/EditListingPage'
import { MyListingsPage } from '@/features/listings/MyListingsPage'
import { FavoritesPage } from '@/features/listings/FavoritesPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { MessagesPage } from '@/features/chat/MessagesPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { NotFoundPage } from '@/features/misc/NotFoundPage'
import { AdminLayout } from '@/features/admin/AdminLayout'
import { AdminRoute } from '@/features/admin/AdminRoute'
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage'
import { UserManagementPage } from '@/features/admin/UserManagementPage'
import { ModerationQueuePage } from '@/features/admin/ModerationQueuePage'
import { CategoryManagementPage } from '@/features/admin/CategoryManagementPage'
import { AuditLogPage } from '@/features/admin/AuditLogPage'
import { useAuthStore } from '@/stores/authStore'

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuthStore()
  return isLoggedIn() ? <Navigate to="/" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Main layout — Navbar + Footer */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/listings/new" element={<CreateListingPage />} />
            <Route path="/listings/:id/edit" element={<EditListingPage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/users/:id" element={<ProfilePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Admin layout — protected by role */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="moderation" element={<ModerationQueuePage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="categories" element={<CategoryManagementPage />} />
            <Route path="audit-logs" element={<AuditLogPage />} />
          </Route>

          {/* Auth — full screen, redirect if already logged in */}
          <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
