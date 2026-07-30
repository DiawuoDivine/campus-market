import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShoppingBag, Loader2, CheckCircle2, XCircle, Clock,
  Package, ArrowRight, AlertCircle,
} from 'lucide-react'
import { fetchOrders, updateOrderStatus } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { NativeSelect } from '@/components/ui/native-select'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/cn'
import type { OrderDTO } from '@/lib/types'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-100  text-amber-800',  icon: <Clock size={13} /> },
  accepted:  { label: 'Accepted',  color: 'bg-blue-100   text-blue-800',   icon: <CheckCircle2 size={13} /> },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 size={13} /> },
  declined:  { label: 'Declined',  color: 'bg-red-100    text-red-800',    icon: <XCircle size={13} /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100   text-gray-600',   icon: <XCircle size={13} /> },
}

export function OrdersPage() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const qc = useQueryClient()
  const { toast } = useToast()
  const [tab, setTab] = useState<'buying' | 'selling'>('buying')

  if (!isLoggedIn()) { navigate('/login'); return null }

  const { data = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    staleTime: 15_000,
  })

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast({ title: 'Order updated', variant: 'success' })
    },
    onError: (err: Error) => toast({ title: 'Failed', description: err.message, variant: 'error' }),
  })

  const buying  = data.filter((o) => o.buyerId  === user?.id)
  const selling = data.filter((o) => o.sellerId === user?.id)
  const displayed = tab === 'buying' ? buying : selling

  return (
    <div className="container py-8 pb-16 max-w-3xl">
      <div className="mb-8">
        <p className="section-label mb-1">Transactions</p>
        <h1 className="font-serif text-4xl font-bold text-primary">Orders</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit mb-6">
        {(['buying', 'selling'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === t ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'buying' ? `Buying (${buying.length})` : `Selling (${selling.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Package size={40} className="mx-auto text-muted-foreground/20 mb-4" />
          <h2 className="font-serif text-xl font-bold text-primary mb-2">No orders yet</h2>
          <p className="text-muted-foreground text-sm mb-5">
            {tab === 'buying'
              ? 'Find something you like and send a purchase request.'
              : 'When buyers request your items, they\'ll appear here.'}
          </p>
          {tab === 'buying' && (
            <Button onClick={() => navigate('/catalog')} className="gap-2">
              <ShoppingBag size={15} /> Browse listings
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((order) => <OrderCard key={order.id} order={order} userId={user!.id} onAction={(id, status) => mutation.mutate({ id, status })} isPending={mutation.isPending} />)}
        </div>
      )}
    </div>
  )
}

function OrderCard({
  order, userId, onAction, isPending,
}: {
  order: OrderDTO
  userId: string
  onAction: (id: string, status: string) => void
  isPending: boolean
}) {
  const isBuyer  = order.buyerId  === userId
  const isSeller = order.sellerId === userId
  const config   = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['pending']!

  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:border-primary/20 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full', config.color)}>
              {config.icon} {config.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {isBuyer ? 'You are buying' : 'You are selling'}
            </span>
          </div>

          {order.listingId && (
            <Link to={`/listings/${order.listingId}`} className="font-semibold hover:text-primary transition-colors flex items-center gap-1.5 text-sm">
              <ShoppingBag size={13} className="shrink-0" />
              {order.listingTitle ?? 'View listing'} <ArrowRight size={12} />
            </Link>
          )}

          {order.meetupLocation && (
            <p className="text-xs text-muted-foreground">
              📍 {order.meetupLocation}
              {order.meetupTime && ` · ${new Date(order.meetupTime).toLocaleString()}`}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Created {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {order.status === 'pending' && isSeller && (
            <>
              <Button size="sm" disabled={isPending} onClick={() => onAction(order.id, 'accepted')}
                className="gap-1"><CheckCircle2 size={13} /> Accept</Button>
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => onAction(order.id, 'declined')}
                className="gap-1 text-destructive border-destructive/30 hover:bg-red-50"><XCircle size={13} /> Decline</Button>
            </>
          )}
          {order.status === 'pending' && isBuyer && (
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => onAction(order.id, 'cancelled')}
              className="gap-1 text-muted-foreground"><XCircle size={13} /> Cancel</Button>
          )}
          {order.status === 'accepted' && (
            <Button size="sm" disabled={isPending} onClick={() => onAction(order.id, 'completed')}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 size={13} /> Mark complete</Button>
          )}
        </div>
      </div>
    </div>
  )
}
