import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search, SlidersHorizontal, Plus, AlertCircle,
  ShoppingBag, X, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchListings, fetchCategories } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ListingCard, ListingCardSkeleton } from './ListingCard'
import { useAuthStore } from '@/stores/authStore'
import type { ListingsQuery } from '@/lib/types'

const CONDITIONS = [
  { value: 'new',      label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'used',     label: 'Used' },
  { value: 'fair',     label: 'Fair' },
  { value: 'poor',     label: 'Poor' },
]

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'price_asc',  label: 'Price: low → high' },
  { value: 'price_desc', label: 'Price: high → low' },
  { value: 'popular',    label: 'Most popular' },
]

export function CatalogPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isLoggedIn } = useAuthStore()

  // ── Filter state ──────────────────────────────────────────────
  const [search,     setSearch]     = useState(searchParams.get('search')      ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') ?? '')
  const [condition,  setCondition]  = useState(searchParams.get('condition')   ?? '')
  const [sort,       setSort]       = useState<ListingsQuery['sort']>(
    (searchParams.get('sort') as ListingsQuery['sort']) ?? 'newest',
  )
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') ?? '')
  const [page,     setPage]     = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Sync URL → state on first mount
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '')
    setCategoryId(searchParams.get('category_id') ?? '')
    setCondition(searchParams.get('condition') ?? '')
    setSort((searchParams.get('sort') as ListingsQuery['sort']) ?? 'newest')
    setMinPrice(searchParams.get('min_price') ?? '')
    setMaxPrice(searchParams.get('max_price') ?? '')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build query params ────────────────────────────────────────
  const queryParams: ListingsQuery = {
    page,
    limit: 20,
    ...(search     && { search }),
    ...(categoryId && { category_id: categoryId }),
    ...(condition  && { condition }),
    ...(sort       && { sort }),
    ...(minPrice   && !isNaN(Number(minPrice)) && { min_price: Math.round(Number(minPrice) * 100) }),
    ...(maxPrice   && !isNaN(Number(maxPrice)) && { max_price: Math.round(Number(maxPrice) * 100) }),
  }

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['listings', queryParams],
    queryFn:  () => fetchListings(queryParams),
    placeholderData: (prev) => prev, // keep previous data while fetching next page
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  fetchCategories,
    staleTime: 300_000,
  })

  const listings = data?.data ?? []
  const meta     = data?.meta
  const categoryName = categories.find((c) => c.id === categoryId)?.name

  // ── Helpers ───────────────────────────────────────────────────
  function applySearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    const p = new URLSearchParams()
    if (search)     p.set('search',      search)
    if (categoryId) p.set('category_id', categoryId)
    if (condition)  p.set('condition',   condition)
    if (sort && sort !== 'newest') p.set('sort', sort)
    if (minPrice)   p.set('min_price',   minPrice)
    if (maxPrice)   p.set('max_price',   maxPrice)
    setSearchParams(p)
  }

  function clearFilters() {
    setSearch(''); setCategoryId(''); setCondition('')
    setSort('newest'); setMinPrice(''); setMaxPrice('')
    setPage(1)
    setSearchParams(new URLSearchParams())
  }

  function removeFilter(key: string) {
    if (key === 'search')     setSearch('')
    if (key === 'category')   setCategoryId('')
    if (key === 'condition')  setCondition('')
    if (key === 'sort')       setSort('newest')
    if (key === 'price')      { setMinPrice(''); setMaxPrice('') }
    setPage(1)
  }

  const hasFilters = !!(search || categoryId || condition || sort !== 'newest' || minPrice || maxPrice)

  // ── Active filter chips ───────────────────────────────────────
  const activeChips: { key: string; label: string }[] = []
  if (search)              activeChips.push({ key: 'search',    label: `"${search}"` })
  if (categoryName)        activeChips.push({ key: 'category',  label: categoryName })
  if (condition)           activeChips.push({ key: 'condition', label: condition.replace('_', ' ') })
  if (sort !== 'newest')   activeChips.push({ key: 'sort', label: SORT_OPTIONS.find(s => s.value === sort)?.label ?? sort ?? 'newest' })
  if (minPrice || maxPrice) {
    const label = minPrice && maxPrice
      ? `GH₵${minPrice} – GH₵${maxPrice}`
      : minPrice ? `≥ GH₵${minPrice}` : `≤ GH₵${maxPrice}`
    activeChips.push({ key: 'price', label })
  }

  return (
    <div className="container py-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            Student marketplace
          </p>
          <h1 className="font-serif text-4xl font-bold text-primary">
            {categoryName ?? 'All listings'}
          </h1>
          {meta ? (
            <p className="text-sm text-muted-foreground mt-1">
              {meta.total.toLocaleString()} {meta.total === 1 ? 'item' : 'items'} found
            </p>
          ) : isLoading ? (
            <Skeleton className="h-4 w-28 mt-2" />
          ) : null}
        </div>
        {isLoggedIn() && (
          <Button onClick={() => navigate('/listings/new')} className="shrink-0 gap-2">
            <Plus size={16} /> Create listing
          </Button>
        )}
      </div>

      {/* ── Search bar ── */}
      <form onSubmit={applySearch} className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings…"
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFilters((f) => !f)}
            aria-label="Toggle filters"
            title="Filters"
          >
            {showFilters ? <ChevronUp size={16} /> : <SlidersHorizontal size={16} />}
          </Button>
          <Button type="submit" disabled={isFetching}>Search</Button>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <Select value={categoryId || 'all'} onValueChange={(v) => { setCategoryId(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="h-9 text-sm bg-white">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Condition */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Condition</Label>
              <Select value={condition || 'all'} onValueChange={(v) => { setCondition(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="h-9 text-sm bg-white">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any condition</SelectItem>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Sort by</Label>
              <Select value={sort ?? 'newest'} onValueChange={(v) => { setSort(v as ListingsQuery['sort']); setPage(1) }}>
                <SelectTrigger className="h-9 text-sm bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min price */}
            <div className="space-y-1.5">
              <Label htmlFor="min-price" className="text-xs font-semibold">Min price (GH₵)</Label>
              <Input
                id="min-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
                className="h-9 text-sm bg-white"
              />
            </div>

            {/* Max price */}
            <div className="space-y-1.5">
              <Label htmlFor="max-price" className="text-xs font-semibold">Max price (GH₵)</Label>
              <Input
                id="max-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
                className="h-9 text-sm bg-white"
              />
            </div>
          </div>
        )}
      </form>

      {/* ── Active filter chips ── */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {activeChips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="gap-1.5 pr-1.5 cursor-pointer hover:bg-muted capitalize"
              onClick={() => removeFilter(chip.key)}
            >
              {chip.label}
              <X size={11} />
            </Badge>
          ))}
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex items-center gap-3">
          <AlertCircle size={18} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        </div>

      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {Array.from({ length: 20 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>

      ) : listings.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
            <ShoppingBag size={36} className="text-muted-foreground/30" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-primary mb-2">No listings found</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            {hasFilters
              ? 'Nothing matches your filters right now. Try broadening your search.'
              : 'No listings yet. Be the first to sell something on campus!'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
            )}
            {isLoggedIn() && (
              <Button onClick={() => navigate('/listings/new')} className="gap-2">
                <Plus size={15} /> Create a listing
              </Button>
            )}
          </div>
        </div>

      ) : (
        <>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
            style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.15s' }}
          >
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} onClick={() => navigate(`/listings/${l.id}`)} />
            ))}
          </div>

          {/* ── Pagination ── */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(meta.total_pages, 5) }, (_, i) => {
                  // Show pages around current page
                  let p: number
                  if (meta.total_pages <= 5) {
                    p = i + 1
                  } else if (page <= 3) {
                    p = i + 1
                  } else if (page >= meta.total_pages - 2) {
                    p = meta.total_pages - 4 + i
                  } else {
                    p = page - 2 + i
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      disabled={isFetching}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                        p === page
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.total_pages || isFetching}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
