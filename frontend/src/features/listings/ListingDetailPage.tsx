import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, ShoppingBag, MessageCircle, Heart, ShieldCheck,
  BadgeCheck, Star, MapPin, Eye, Tag, ChevronLeft, ChevronRight,
  Loader2, AlertCircle,
} from 'lucide-react'
import { fetchListing, toggleFavorite, startConversation } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/cn'

const CONDITION_STYLES: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-800',
  like_new: 'bg-green-100 text-green-800',
  used: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-orange-100 text-orange-800',
}
const CONDITION_LABELS: Record<string, string> = {
  new: 'New', like_new: 'Like new', used: 'Used', fair: 'Fair', poor: 'Poor',
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuthStore()
  const { toast } = useToast()
  const [imgIndex, setImgIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [messaging, setMessaging] = useState(false)

  const { data: listing, isLoading, isError, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id!),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return (
      <div className="container py-20 flex items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading listing…
      </div>
    )
  }

  if (isError || !listing) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle size={40} className="mx-auto text-destructive mb-4" />
          <h2 className="font-serif text-2xl font-bold text-primary mb-2">Listing not found</h2>
          <p className="text-muted-foreground mb-6 text-sm">{(error as Error)?.message}</p>
          <Button variant="outline" onClick={() => navigate('/catalog')} className="gap-2">
            <ArrowLeft size={16} /> Back to catalog
          </Button>
        </div>
      </div>
    )
  }

  const images = listing.images ?? []
  const currentImage = images[imgIndex]?.url
  const isSeller = user?.id === listing.sellerId

  async function handleFavorite() {
    if (!isLoggedIn()) { navigate('/login'); return }
    try {
      const res = await toggleFavorite(listing.id)
      setLiked(res.added)
      toast({
        title: res.added ? 'Saved to favorites' : 'Removed from favorites',
        variant: res.added ? 'success' : 'default',
      })
    } catch {
      toast({ title: 'Could not update favorites', variant: 'error' })
    }
  }

  async function handleMessage() {
    if (!isLoggedIn()) { navigate('/login'); return }
    if (isSeller) return
    setMessaging(true)
    try {
      const conv = await startConversation(listing.id, listing.sellerId)
      navigate(`/messages?conversation=${conv.id}`)
    } catch (err) {
      toast({ title: 'Could not open chat', description: (err as Error).message, variant: 'error' })
    } finally {
      setMessaging(false)
    }
  }

  return (
    <div className="container py-8 pb-16">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 mb-6 -ml-2 text-muted-foreground hover:text-primary">
        <ArrowLeft size={16} /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        {/* ── Images ── */}
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[4/3]">
            {currentImage ? (
              <img src={currentImage} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <ShoppingBag size={56} />
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIndex((i) => Math.max(0, i - 1))}
                  disabled={imgIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center disabled:opacity-30 hover:bg-white transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setImgIndex((i) => Math.min(images.length - 1, i + 1))}
                  disabled={imgIndex === images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center disabled:opacity-30 hover:bg-white transition"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={cn(
                    'shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition',
                    i === imgIndex ? 'border-primary' : 'border-transparent hover:border-primary/30',
                  )}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ── */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-start gap-2 mb-3">
              <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', CONDITION_STYLES[listing.condition] ?? 'bg-gray-100 text-gray-700')}>
                {CONDITION_LABELS[listing.condition] ?? listing.condition}
              </span>
              {listing.category && (
                <Badge variant="outline" className="text-xs">
                  <Tag size={10} className="mr-1" /> {listing.category.name}
                </Badge>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary leading-tight">
              {listing.title}
            </h1>
            <p className="text-4xl font-bold text-primary mt-3">
              GH₵ {(listing.price / 100).toFixed(2)}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Eye size={12} /> {listing.viewCount} views</span>
              <span>{listing.quantity} available</span>
              {listing.createdAt && <span>{new Date(listing.createdAt).toLocaleDateString()}</span>}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="font-semibold text-sm mb-2">Description</h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          <Separator />

          {/* Seller card */}
          {listing.seller && (
            <div className="rounded-xl border border-border p-4 flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={listing.seller.avatarUrl} />
                <AvatarFallback>{listing.seller.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <Link to={`/users/${listing.seller.id}`} className="font-semibold text-sm hover:text-primary flex items-center gap-1">
                  {listing.seller.fullName}
                  {listing.seller.isVerified && <BadgeCheck size={14} className="text-primary" />}
                </Link>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {listing.seller.campus && <span className="flex items-center gap-1"><MapPin size={10} />{listing.seller.campus}</span>}
                  {listing.seller.ratingAvg > 0 && (
                    <span className="flex items-center gap-1">
                      <Star size={10} fill="currentColor" className="text-yellow-400" />
                      {listing.seller.ratingAvg.toFixed(1)} ({listing.seller.ratingCount})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            {!isSeller && (
              <Button className="flex-1 gap-2" size="lg" onClick={handleMessage} disabled={messaging}>
                <MessageCircle size={18} /> {messaging ? 'Opening…' : 'Message seller'}
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={handleFavorite} className={cn('gap-2', liked && 'border-red-300 text-red-500')}>
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            </Button>
          </div>

          <div className="flex items-start gap-2 text-xs text-primary bg-primary/5 rounded-lg p-3">
            <ShieldCheck size={14} className="shrink-0 mt-0.5" />
            Meet in a visible campus location and inspect items before paying.
          </div>
        </div>
      </div>
    </div>
  )
}
