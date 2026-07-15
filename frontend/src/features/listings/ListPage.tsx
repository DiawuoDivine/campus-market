import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2, AlertCircle } from 'lucide-react'
import { fetchCategories, fetchListings } from '@/lib/api'
import type { CategoryDTO, ListingDTO } from '@/lib/types'
import { CategoryFilter } from './CategoryFilter'
import { ListingCard } from './ListingCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ListPage() {
    const [listings, setListings] = useState<ListingDTO[]>([])
    const [categories, setCategories] = useState<CategoryDTO[]>([])
    const [selectedCategory, setSelectedCategory] = useState('')
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadListings = async (category = '', search = '') => {
        setLoading(true)
        setError(null)
        try {
            const params: Record<string, string | number> = {
                limit: 20,
            }
            if (category) {
                params.category_id = category
            }
            if (search) {
                params.search = search
            }
            const data = await fetchListings(params)
            setListings(data)
        } catch (err) {
            setError((err as Error).message || 'Failed to load listings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
            .then(setCategories)
            .catch(() => setError('Failed to load categories'))
    }, [])

    useEffect(() => {
        loadListings(selectedCategory, query)
    }, [selectedCategory, query])

    const heading = useMemo(() => {
        if (selectedCategory) {
            const category = categories.find((item) => item.id === selectedCategory)
            return category ? `${category.name} listings` : 'Listings'
        }
        return 'Latest listings'
    }, [categories, selectedCategory])

    return (
        <main className="min-h-screen bg-background">
            <div className="container py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{heading}</h1>
                    <p className="text-muted-foreground">
                        Browse campus marketplace listings by category and keyword.
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CategoryFilter
                        categories={categories}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                    />
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search titles or descriptions..."
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>Loading listings…</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                        <p className="text-destructive">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadListings(selectedCategory, query)}
                            className="ml-auto"
                        >
                            Retry
                        </Button>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-lg text-muted-foreground">
                            No matching listings found. Try adjusting your filters.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {listings.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
