import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  BookOpen, Bell, MessageCircle, UserRound, Plus,
  LogOut, ChevronDown, Menu, X, ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { fetchNotifications } from '@/lib/api'
import { useState } from 'react'
import { cn } from '@/lib/cn'

export function Navbar() {
  const { user, clearAuth, isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropOpen, setDropOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: isLoggedIn(),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function handleLogout() {
    clearAuth()
    setDropOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  function isActive(path: string) {
    return location.pathname === path
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 font-serif text-xl font-bold text-primary shrink-0">
            <BookOpen size={22} />
            <span>UniMarket</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: '/catalog', label: 'Catalog' },
              { to: '/catalog?sort=popular', label: 'Trending' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                  isActive(to.split('?')[0]!)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-primary hover:bg-muted',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn() ? (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/messages" aria-label="Messages">
                    <MessageCircle size={20} />
                  </Link>
                </Button>

                {/* Bell with unread badge */}
                <Link to="/notifications" aria-label="Notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                  <Bell size={20} className="text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <Button asChild size="sm">
                  <Link to="/listings/new">
                    <Plus size={16} className="mr-1" /> Sell
                  </Link>
                </Button>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropOpen((o) => !o)}
                    aria-expanded={dropOpen}
                    className="flex items-center gap-1.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback>{initials ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <ChevronDown size={14} className={cn('text-muted-foreground transition-transform duration-200', dropOpen && 'rotate-180')} />
                  </button>

                  {dropOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                      <div className="absolute right-0 top-11 z-20 w-52 rounded-2xl border border-border bg-white shadow-xl py-1.5 overflow-hidden">
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-sm font-bold truncate">{user?.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                        </div>
                        <div className="py-1">
                          <DropItem icon={<UserRound size={15} />} label="Profile" to="/profile" onClose={() => setDropOpen(false)} />
                          <DropItem icon={<ShoppingBag size={15} />} label="My Listings" to="/my-listings" onClose={() => setDropOpen(false)} />
                          <DropItem icon={<Bell size={15} />} label="Notifications" to="/notifications" badge={unreadCount} onClose={() => setDropOpen(false)} />
                        </div>
                        <div className="border-t border-border pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} /> Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
                <Button size="sm" asChild><Link to="/register">Join free</Link></Button>
              </>
            )}
          </div>

          {/* Mobile: badge dot + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            {isLoggedIn() && (
              <Link to="/notifications" className="relative p-2">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
                )}
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-16 inset-x-0 z-40 bg-white border-b border-border shadow-xl md:hidden">
            <nav className="container py-4 flex flex-col gap-0.5">
              <MobileLink to="/catalog" label="Catalog" active={isActive('/catalog')} onClose={() => setMobileOpen(false)} />
              <MobileLink to="/catalog?sort=popular" label="Trending" active={false} onClose={() => setMobileOpen(false)} />

              {isLoggedIn() ? (
                <>
                  <div className="h-px bg-border my-2" />
                  <MobileLink to="/listings/new" label="+ Create listing" active={isActive('/listings/new')} onClose={() => setMobileOpen(false)} highlight />
                  <MobileLink to="/messages" label="Messages" active={isActive('/messages')} onClose={() => setMobileOpen(false)} />
                  <MobileLink
                    to="/notifications"
                    label={`Notifications${unreadCount > 0 ? ` · ${unreadCount} new` : ''}`}
                    active={isActive('/notifications')}
                    onClose={() => setMobileOpen(false)}
                  />
                  <MobileLink to="/my-listings" label="My Listings" active={isActive('/my-listings')} onClose={() => setMobileOpen(false)} />
                  <MobileLink to="/profile" label="Profile" active={isActive('/profile')} onClose={() => setMobileOpen(false)} />
                  <div className="h-px bg-border my-2" />
                  <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-destructive hover:bg-red-50 transition-colors">
                    <LogOut size={16} /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <div className="h-px bg-border my-2" />
                  <MobileLink to="/login" label="Sign in" active={isActive('/login')} onClose={() => setMobileOpen(false)} />
                  <MobileLink to="/register" label="Join free" active={isActive('/register')} onClose={() => setMobileOpen(false)} highlight />
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  )
}

function DropItem({ icon, label, to, badge, onClose }: {
  icon: React.ReactNode; label: string; to: string; badge?: number; onClose: () => void
}) {
  return (
    <Link to={to} onClick={onClose} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}

function MobileLink({ to, label, active, onClose, highlight }: {
  to: string; label: string; active: boolean; onClose: () => void; highlight?: boolean
}) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className={cn(
        'px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
        active ? 'text-primary bg-primary/10' :
        highlight ? 'text-primary hover:bg-primary/10' :
        'text-foreground hover:bg-muted',
      )}
    >
      {label}
    </Link>
  )
}
