import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import { Layout } from '@/components/shared/Layout'
import { HomePage } from '@/features/home/HomePage'
import { CatalogPage } from '@/features/listings/CatalogPage'
import { ListingDetailPage } from '@/features/listings/ListingDetailPage'
import { CreateListingPage } from '@/features/listings/CreateListingPage'
import { MyListingsPage } from '@/features/listings/MyListingsPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { MessagesPage } from '@/features/chat/MessagesPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { NotFoundPage } from '@/features/misc/NotFoundPage'
import { useAuthStore } from '@/stores/authStore'

/** Redirect logged-in users away from auth pages */
function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuthStore()
  return isLoggedIn() ? <Navigate to="/" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <Routes>
        {/* Routes that share the main Layout (Navbar + Footer) */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/listings/new" element={<CreateListingPage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users/:id" element={<ProfilePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Full-screen auth pages (no layout chrome) */}
        <Route
          path="/login"
          element={<GuestOnly><LoginPage /></GuestOnly>}
        />
        <Route
          path="/register"
          element={<GuestOnly><RegisterPage /></GuestOnly>}
        />
      </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
