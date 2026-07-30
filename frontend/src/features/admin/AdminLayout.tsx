import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Flag, Users, FolderTree, ScrollText, ArrowLeft, Shield,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/stores/authStore'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/moderation', label: 'Moderation', icon: Flag },
  { to: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree, adminOnly: true },
  { to: '/admin/audit-logs', label: 'Audit Log', icon: ScrollText, adminOnly: true },
]

export function AdminLayout() {
  const location = useLocation()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={16} /> Back to marketplace
            </Link>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2 font-serif font-bold text-primary">
              <Shield size={18} />
              Admin Panel
            </div>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {user?.fullName} · {user?.role}
          </span>
        </div>
      </header>

      <div className="container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
              {NAV.filter((item) => !item.adminOnly || isAdmin).map(({ to, label, icon: Icon, exact }) => {
                const active = exact ? location.pathname === to : location.pathname.startsWith(to)
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
