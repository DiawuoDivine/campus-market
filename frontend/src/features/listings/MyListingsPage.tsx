import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, ShoppingBag, Trash2, Edit3, Eye } from 'lucide-react'
import { fetchListings, deleteListing, updateListing } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-600',
}

export function MyListingsPage() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const qc = useQueryClient()

  if (!isLoggedIn()) {
    navigate('/login')
    return null
  }

  const { data, isLoading } = useQuery({
    queryKey: ['my-listings', user?.id],
    queryFn: () => fetchListings({ seller_id: user!.id, limit: 50 }),
    enabled: Boolean(user?.id),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-listings'] }),
  })

  const archiveMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => updateListing(id, { status: 'archived' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-listings'] }),
  })

  const listings = data?.data ?? []

  return (
    <div className="container py-8 pb-16 max-w-4xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Manage</p>
          <h1 className="font-serif text-4xl font-bold text-primary">My listings</h1>
          {data?.meta && (
            <p className="text-sm text-muted-foreground mt-1">
              {data.meta.total} listing{data.meta.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button onClick={() => navigate('/listings/new')} className="gap-2">
          <Plus size={16} /> New listing
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 size={18} className="animate-spin mr-2" /> Loading your listings…
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <ShoppingBag size={44} className="mx-auto text-muted-foreground/20 mb-4" />
          <h2 className="font-serif text-xl font-bold text-primary mb-2">Nothing listed yet</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Turn unused items into cash. Create your first listing in under a minute.
          </p>
          <Button onClick={() => navigate('/listings/new')} className="gap-2">
            <Plus size={16} /> Create listing
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const image = listing.images?.find((i) => i.isPrimary)?.url ?? listing.images?.[0]?.url
            return (
              <div
                key={listing.id}
                className="flex items-center gap-4 bg-white rounded-2xl border border-border p-4 shadow-sm hover:border-primary/30 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                  {image ? (
                    <img src={image} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <ShoppingBag size={22} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{listing.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', STATUS_STYLES[listing.status] ?? 'bg-gray-100 text-gray-600')}>
                      {listing.status}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      GH₵ {(listing.price / 100).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye size={11} /> {listing.viewCount}
                    </span>
                    {listing.category && (
                      <Badge variant="outline" className="text-[10px] py-0">{listing.category.name}</Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    title="View listing"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/listings/${listing.id}/edit`)}
                    title="Edit listing"
                  >
                    <Edit3 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this listing permanently?')) {
                        deleteMutation.mutate(listing.id)
                      }
                    }}
                    title="Delete listing"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
