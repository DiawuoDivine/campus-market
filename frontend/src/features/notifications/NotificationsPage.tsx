import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, ShoppingBag, MessageCircle, Star, ShieldAlert } from 'lucide-react'
import { fetchNotifications } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  new_message: <MessageCircle size={16} className="text-blue-500" />,
  new_offer: <ShoppingBag size={16} className="text-primary" />,
  offer_accepted: <ShoppingBag size={16} className="text-emerald-500" />,
  offer_declined: <ShoppingBag size={16} className="text-destructive" />,
  listing_sold: <ShoppingBag size={16} className="text-emerald-600" />,
  review_received: <Star size={16} className="text-yellow-500" />,
  moderation_action: <ShieldAlert size={16} className="text-destructive" />,
}

const TYPE_LABELS: Record<string, string> = {
  new_message: 'New message',
  new_offer: 'New offer',
  offer_accepted: 'Offer accepted',
  offer_declined: 'Offer declined',
  listing_sold: 'Item sold',
  review_received: 'New review',
  moderation_action: 'Moderation notice',
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const qc = useQueryClient()

  if (!isLoggedIn()) {
    navigate('/login')
    return null
  }

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
  })

  // Mark all read via API call
  const markAllMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('access_token')
      const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
      await fetch(`${base}/api/v1/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  function parsePayload(raw: string) {
    try { return JSON.parse(raw) } catch { return {} }
  }

  return (
    <div className="container py-8 pb-16 max-w-2xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Updates</p>
          <h1 className="font-serif text-4xl font-bold text-primary">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 size={18} className="animate-spin mr-2" /> Loading notifications…
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Bell size={44} className="mx-auto text-muted-foreground/20 mb-4" />
          <h2 className="font-serif text-xl font-bold text-primary mb-2">All caught up</h2>
          <p className="text-muted-foreground text-sm">
            Notifications about messages, offers, and reviews will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const payload = parsePayload(notif.payload)
            const icon = TYPE_ICONS[notif.type] ?? <Bell size={16} className="text-muted-foreground" />
            const label = TYPE_LABELS[notif.type] ?? notif.type.replace(/_/g, ' ')

            return (
              <div
                key={notif.id}
                className={cn(
                  'flex items-start gap-4 rounded-xl border p-4 transition-colors',
                  notif.isRead
                    ? 'bg-white border-border'
                    : 'bg-primary/5 border-primary/20',
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                  notif.isRead ? 'bg-muted' : 'bg-primary/10',
                )}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', !notif.isRead && 'text-primary')}>
                    {label}
                  </p>
                  {payload.message && (
                    <p className="text-sm text-muted-foreground mt-0.5">{payload.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.createdAt).toLocaleString([], {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
