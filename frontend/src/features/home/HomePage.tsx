import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ShieldCheck, LockKeyhole, MapPin, ArrowRight,
  BookOpen, Laptop, Shirt, Sofa, Dumbbell, Wrench, Utensils,
  Star, BadgeCheck, TrendingUp, Users, ShoppingBag, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { fetchListings, fetchListingStats } from '@/lib/api'
import { ListingCard, ListingCardSkeleton } from '@/features/listings/ListingCard'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  electronics: <Laptop   size={24} />,
  textbooks:   <BookOpen size={24} />,
  fashion:     <Shirt    size={24} />,
  furniture:   <Sofa     size={24} />,
  sports:      <Dumbbell size={24} />,
  services:    <Wrench   size={24} />,
  'food-drinks': <Utensils size={24} />,
  'lost-found':  <Search   size={24} />,
}

const CATEGORY_COLORS: Record<string, string> = {
  electronics:   'bg-blue-50   text-blue-600   border-blue-100   group-hover:bg-blue-500',
  textbooks:     'bg-amber-50  text-amber-600  border-amber-100  group-hover:bg-amber-500',
  fashion:       'bg-pink-50   text-pink-600   border-pink-100   group-hover:bg-pink-500',
  furniture:     'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500',
  sports:        'bg-orange-50  text-orange-600  border-orange-100  group-hover:bg-orange-500',
  services:      'bg-purple-50  text-purple-600  border-purple-100  group-hover:bg-purple-500',
  'food-drinks': 'bg-red-50     text-red-600     border-red-100     group-hover:bg-red-500',
  'lost-found':  'bg-slate-50   text-slate-600   border-slate-100   group-hover:bg-slate-500',
}

export function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: featuredRes, isLoading: loadingFeatured } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn:  () => fetchListings({ limit: 8, sort: 'newest' }),
    staleTime: 60_000,
  })
  const { data: popularRes, isLoading: loadingPopular } = useQuery({
    queryKey: ['listings', 'popular'],
    queryFn:  () => fetchListings({ limit: 4, sort: 'popular' }),
    staleTime: 60_000,
  })
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['listing-stats'],
    queryFn:  fetchListingStats,
    staleTime: 120_000,
  })

  const featured     = featuredRes?.data ?? []
  const popular      = popularRes?.data  ?? []
  const topCategories = stats?.topCategories ?? []

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(`/catalog${search ? `?search=${encodeURIComponent(search)}` : ''}`)
  }

  function scrollCats(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' })
  }

  return (
    <div className="page-enter">

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        <div className="absolute inset-0 bg-dots opacity-30" />
        {/* Blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -left-16 w-64 h-64 rounded-full bg-accent/20 blur-2xl" />

        <div className="relative container py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest border border-primary/15 animate-fade-in">
              <BadgeCheck size={13} /> Verified student exchange
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-primary leading-[1.1] mb-6 animate-fade-up">
              Your campus.{' '}
              <span className="relative">
                <span className="text-gradient">Your marketplace.</span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up delay-75">
              Buy, sell, and trade within a trusted, institution-verified community. Every account is tied to your student index number.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="relative flex items-center max-w-2xl mx-auto animate-fade-up delay-150"
            >
              <div className="flex-1 flex items-center bg-white border-2 border-border rounded-2xl shadow-lg shadow-primary/5 overflow-hidden focus-within:border-primary transition-colors">
                <Search size={18} className="ml-4 shrink-0 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search textbooks, electronics, services…"
                  className="border-0 shadow-none focus-visible:ring-0 text-base h-14 px-3"
                />
                <Button type="submit" size="lg" className="m-2 rounded-xl shrink-0 px-6">
                  Search
                </Button>
              </div>
            </form>

            {/* Quick search pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 animate-fade-up delay-200">
              {['Laptops', 'Calculus textbook', 'Study desk', 'Past questions'].map((q) => (
                <button
                  key={q}
                  onClick={() => navigate(`/catalog?search=${encodeURIComponent(q)}`)}
                  className="text-xs px-3 py-1.5 bg-white border border-border rounded-full text-muted-foreground hover:text-primary hover:border-primary transition-colors shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ STATS BAR ══════════ */}
      <section className="border-y border-border bg-white">
        <div className="container py-5 grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
          {[
            { icon: <ShoppingBag size={18} />, value: stats?.totalListings, label: 'Active listings' },
            { icon: <Users       size={18} />, value: stats?.totalUsers,    label: 'Verified students' },
            { icon: <TrendingUp  size={18} />, value: stats?.totalSold,     label: 'Items sold' },
            { icon: <Sparkles    size={18} />, value: stats?.newThisWeek,   label: 'New this week' },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-center gap-3 px-4 py-2">
              <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center text-primary shrink-0">
                {s.icon}
              </div>
              <div>
                {loadingStats
                  ? <><Skeleton className="h-5 w-10 mb-1" /><Skeleton className="h-3 w-20" /></>
                  : <>
                      <p className="text-xl font-black text-primary leading-none">{s.value?.toLocaleString() ?? '—'}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{s.label}</p>
                    </>
                }
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ CATEGORIES ══════════ */}
      <section className="container py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="section-label mb-1">Browse by category</p>
            <h2 className="font-serif text-3xl font-bold text-primary">What are you looking for?</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scrollCats('left')} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => scrollCats('right')} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {loadingStats ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-28 rounded-2xl shrink-0" />)}
          </div>
        ) : (
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {topCategories.map((cat) => {
              const colorClass = CATEGORY_COLORS[cat.slug] ?? 'bg-muted text-muted-foreground border-border group-hover:bg-primary'
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/catalog?category_id=${cat.id}`)}
                  className="group flex flex-col items-center gap-3 rounded-2xl border bg-white p-5 hover:shadow-md transition-all duration-200 shrink-0 w-28 hover:-translate-y-0.5"
                >
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:text-white ${colorClass}`}>
                    {CATEGORY_ICONS[cat.slug] ?? <BookOpen size={22} />}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold leading-tight text-foreground">{cat.name}</p>
                    {cat.count > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{cat.count} items</p>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* ══════════ POPULAR ══════════ */}
      {(loadingPopular || popular.length > 0) && (
        <section className="bg-muted/30 border-y border-border py-14">
          <div className="container">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="section-label mb-1">Trending now</p>
                <h2 className="font-serif text-3xl font-bold text-primary">Most popular</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/catalog?sort=popular')} className="gap-1 hidden sm:flex">
                View all <ArrowRight size={14} />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {loadingPopular
                ? Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)
                : popular.map((l) => <ListingCard key={l.id} listing={l} onClick={() => navigate(`/listings/${l.id}`)} />)
              }
            </div>
          </div>
        </section>
      )}

      {/* ══════════ FEATURED / LATEST ══════════ */}
      <section className="container py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="section-label mb-1">Just listed</p>
            <h2 className="font-serif text-3xl font-bold text-primary">Latest on campus</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/catalog')} className="gap-1 hidden sm:flex">
            View all <ArrowRight size={14} />
          </Button>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-muted/20">
            <ShoppingBag size={44} className="mx-auto text-muted-foreground/20 mb-4" />
            <p className="font-serif text-xl font-bold text-primary mb-2">No listings yet</p>
            <p className="text-muted-foreground text-sm mb-5">Be the first to list something on campus.</p>
            <Button onClick={() => navigate('/listings/new')} className="gap-2">
              <ArrowRight size={15} /> Create first listing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map((l) => <ListingCard key={l.id} listing={l} onClick={() => navigate(`/listings/${l.id}`)} />)}
          </div>
        )}
      </section>

      {/* ══════════ TRUST ══════════ */}
      <section className="border-t border-border bg-white" id="safe-zones">
        <div className="container py-16 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <ShieldCheck size={26} className="text-primary" />,
              title: 'Verified community',
              body: 'Every account is tied to a student index number — only real, enrolled students can buy and sell.',
              color: 'bg-primary/8',
            },
            {
              icon: <LockKeyhole size={26} className="text-primary" />,
              title: 'Private conversations',
              body: 'Negotiate and arrange pickups through secure in-app messaging without sharing personal contact info.',
              color: 'bg-primary/8',
            },
            {
              icon: <MapPin size={26} className="text-primary" />,
              title: 'Safe meet-up zones',
              body: 'Admin-curated campus locations — library, security post, student centre — reduce risk for everyone.',
              color: 'bg-primary/8',
            },
          ].map((f) => (
            <div key={f.title} className="group flex flex-col gap-4 rounded-2xl border border-border bg-white p-7 hover:border-primary/30 hover:shadow-md transition-all duration-200">
              <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center`}>
                {f.icon}
              </div>
              <h3 className="font-serif font-bold text-xl text-primary">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="container py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-0.5 mb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={20} fill="currentColor" className="text-yellow-400" />
            ))}
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4 leading-tight">
            Ready to clear your room or find a great deal?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join free with your student email. Be part of a trusted campus community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/register')} className="gap-2 h-12 px-8 text-base">
              Join free <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/catalog')} className="h-12 px-8 text-base">
              Browse listings
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
