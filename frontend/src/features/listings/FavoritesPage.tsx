import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, ShoppingBag, Loader2, HeartOff } from 'lucide-react'
import { fetchFavorites, fetchListings, toggleFavorite } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { ListingCard } from './ListingCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'

export function FavoritesPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const qc = useQueryClient()
  const { toast } = useToast()

  if (!isLoggedIn()) { navigate('/login'); return null }

  const { data: favs = [], isLoading: loadingFavs } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  })

  // Fetch full listing data for each favorite
  const listingIds = favs.map((f) => f.listingId)
  const { data: listingsRes, isLoading: loadingListings } = useQuery({
    queryKey: ['listings', 'favorites', listingIds],
    queryFn: () => listingIds.length > 0
      ? fetchListings({ limit: 50 })
      : Promise.resolve({ data: [], meta: undefined }),
    enabled: listingIds.length > 0,
  })

  const removeMutation = useMutation({
    mutationFn: (listingId: string) => toggleFavorite(listingId),
    onSuccess: (_, listingId) => {
      qc.invalidateQueries({ queryKey: ['favorites'] })
      toast({ title: 'Removed from favorites', variant: 'default' })
    },
  })

  const isLoading = loadingFavs || loadingListings
  const favoriteListings = (listingsRes?.data ?? []).filter((l) =>
    listingIds.includes(l.id),
  )

  return (
    <div className="container py-8 pb-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="section-label mb-1">Saved items</p>
          <h1 className="font-serif text-4xl font-bold text-primary">Favorites</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              {favoriteListings.length} saved listing{favoriteListings.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/catalog')} className="gap-2 hidden sm:flex">
          <ShoppingBag size={15} /> Browse more
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : favoriteListings.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-red-400" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-primary mb-2">No saved listings</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Tap the ♥ on any listing to save it here for later.
          </p>
          <Button onClick={() => navigate('/catalog')} className="gap-2">
            <ShoppingBag size={15} /> Browse listings
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {favoriteListings.map((listing) => (
            <div key={listing.id} className="relative group">
              <ListingCard listing={listing} onClick={() => navigate(`/listings/${listing.id}`)} />
              {/* Remove favorite overlay */}
              <button
                onClick={() => removeMutation.mutate(listing.id)}
                disabled={removeMutation.isPending}
                title="Remove from favorites"
                className="absolute top-12 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <HeartOff size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
