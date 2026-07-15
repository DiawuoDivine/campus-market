import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, BadgeCheck, Star, ImageOff } from 'lucide-react'
import type { ListingDTO } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { toggleFavorite } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/toast'

// ── Condition styling ─────────────────────────────────────────────────────────
const CONDITION_STYLES: Record<string, string> = {
  new:      'bg-emerald-100 text-emerald-800',
  like_new: 'bg-green-100   text-green-800',
  used:     'bg-blue-100    text-blue-800',
  fair:     'bg-yellow-100  text-yellow-800',
  poor:     'bg-orange-100  text-orange-800',
}
const CONDITION_LABELS: Record<string, string> = {
  new: 'New', like_new: 'Like new', used: 'Used', fair: 'Fair', poor: 'Poor',
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function ListingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-6 w-1/2 mt-1" />
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

// ── Image with fallback ───────────────────────────────────────────────────────
function ListingImage({ src, alt }: { src?: string; alt: string }) {
  const [errored, setErrored] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (!src || errored) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/30 bg-muted">
        <ImageOff size={32} />
        <span className="text-xs font-medium">No image</span>
      </div>
    )
  }

  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={cn(
          'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300',
          !loaded && 'opacity-0',
        )}
      />
    </>
  )
}

// ── Main card ─────────────────────────────────────────────────────────────────
interface Props {
  listing: ListingDTO
  onClick?: () => void
  /** When true renders as a compact horizontal row (used in MyListings) */
  compact?: boolean
}

export function ListingCard({ listing, onClick, compact = false }: Props) {
  const image = listing.images?.find((i) => i.isPrimary)?.url ?? listing.images?.[0]?.url
  const { isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  const isSold     = listing.status === 'sold'
  const isArchived = listing.status === 'archived'
  const isDraft    = listing.status === 'draft'
  const isInactive = isSold || isArchived || isDraft

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isLoggedIn()) { navigate('/login'); return }
    setLikeLoading(true)
    try {
      const res = await toggleFavorite(listing.id)
      setLiked(res.added)
      toast({
        title: res.added ? 'Saved to favorites' : 'Removed from favorites',
        variant: res.added ? 'success' : 'default',
      })
    } catch {
      toast({ title: 'Could not update favorites', variant: 'error' })
    } finally {
      setLikeLoading(false)
    }
  }

  return (
    <article
      onClick={isInactive ? undefined : onClick}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border bg-white overflow-hidden transition-all duration-200',
        !isInactive && onClick && 'cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-primary/30',
        isInactive && 'opacity-70',
      )}
    >
      {/* ── Image ── */}
      <div className="relative h-48 bg-muted overflow-hidden shrink-0">
        <ListingImage src={image} alt={listing.title} />

        {/* Sold / Archived / Draft overlay */}
        {isInactive && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-sm uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full">
              {isSold ? 'Sold' : isArchived ? 'Archived' : 'Draft'}
            </span>
          </div>
        )}

        {/* Condition badge */}
        {!isInactive && (
          <span className={cn(
            'absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full',
            CONDITION_STYLES[listing.condition] ?? 'bg-gray-100 text-gray-700',
          )}>
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </span>
        )}

        {/* Favorite button */}
        {!isInactive && (
          <button
            onClick={handleFavorite}
            disabled={likeLoading}
            aria-label={liked ? 'Remove from favorites' : 'Save to favorites'}
            className={cn(
              'absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow transition-all',
              'hover:scale-110 active:scale-95 disabled:opacity-50',
              liked ? 'text-red-500' : 'text-muted-foreground',
            )}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
          {listing.title}
        </h3>

        {listing.category && (
          <Badge variant="outline" className="w-fit text-[10px] py-0 h-5">
            {listing.category.name}
          </Badge>
        )}

        <p className="text-2xl font-bold text-primary mt-auto">
          GH₵&nbsp;{(listing.price / 100).toFixed(2)}
        </p>

        {/* Seller row */}
        {listing.seller && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-border mt-1">
            <div className="w-5 h-5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shrink-0">
              {listing.seller.fullName.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground truncate flex items-center gap-1 flex-1 min-w-0">
              {listing.seller.fullName}
              {listing.seller.isVerified && (
                <BadgeCheck size={11} className="text-primary shrink-0" />
              )}
            </span>
            {listing.seller.ratingAvg > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                <Star size={10} fill="currentColor" className="text-yellow-400" />
                {listing.seller.ratingAvg.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
