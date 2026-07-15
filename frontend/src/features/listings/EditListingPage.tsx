import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { fetchCategories, fetchListing, updateListing } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { useAuthStore } from '@/stores/authStore'

interface FormValues {
  title: string
  description: string
  price: number
  quantity: number
  condition: string
  categoryId: string
  status: string
  imageUrl: string
}

export function EditListingPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { toast } = useToast()
  const { user, isLoggedIn } = useAuthStore()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { quantity: 1, condition: 'used', status: 'published', categoryId: '', imageUrl: '' },
  })

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const listingQuery = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id!),
    enabled: Boolean(id),
  })

  if (!id) return null
  const listingId = id

  const imageUrl = watch('imageUrl')
  const selectedCondition = watch('condition')
  const selectedStatus = watch('status')
  const selectedCategory = watch('categoryId')

  useEffect(() => {
    if (!listingQuery.data) return

    reset({
      title: listingQuery.data.title ?? '',
      description: listingQuery.data.description ?? '',
      price: (listingQuery.data.price ?? 0) / 100,
      quantity: listingQuery.data.quantity ?? 1,
      condition: listingQuery.data.condition ?? 'used',
      categoryId: listingQuery.data.categoryId ?? '',
      status: listingQuery.data.status ?? 'published',
      imageUrl: listingQuery.data.images?.[0]?.url ?? '',
    })
  }, [listingQuery.data, reset])

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login')
    }
  }, [isLoggedIn, navigate])

  if (listingQuery.isLoading) {
    return (
      <div className="container max-w-2xl py-16 flex items-center justify-center text-muted-foreground">
        <Loader2 size={18} className="mr-2 animate-spin" /> Loading listing…
      </div>
    )
  }

  if (listingQuery.isError || !listingQuery.data) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <p className="text-muted-foreground">We could not load this listing.</p>
      </div>
    )
  }

  if (user?.id && listingQuery.data.sellerId !== user.id) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <p className="text-muted-foreground">You can only edit your own listings.</p>
      </div>
    )
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    setError('')
    try {
      await updateListing(listingId, {
        title: values.title,
        description: values.description,
        price: Math.round(values.price * 100),
        quantity: Number(values.quantity),
        condition: values.condition,
        categoryId: values.categoryId || undefined,
        status: values.status,
        images: values.imageUrl ? [{ url: values.imageUrl, position: 0, isPrimary: true }] : [],
      })
      toast({ title: 'Listing updated', description: values.title, variant: 'success' })
      navigate('/my-listings')
    } catch (e) {
      setError((e as Error).message)
      toast({ title: 'Failed to update listing', description: (e as Error).message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container max-w-2xl py-8 pb-16">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2 mb-6 text-muted-foreground hover:text-primary">
        <ArrowLeft size={16} /> Back
      </Button>

      <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Update listing</p>
        <h1 className="font-serif text-3xl font-bold text-primary mb-1">Edit your listing</h1>
        <p className="text-sm text-muted-foreground mb-7">Keep your item details fresh and accurate.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Calculus textbook, 8th edition"
              {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Min 3 characters' }, maxLength: { value: 120, message: 'Max 120 characters' } })}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={(v) => setValue('categoryId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Condition *</Label>
              <Select value={selectedCondition} onValueChange={(v) => setValue('condition', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[['new', 'New'], ['like_new', 'Like new'], ['used', 'Used'], ['fair', 'Fair'], ['poor', 'Poor']].map(([v, label]) => (
                    <SelectItem key={v} value={v!}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (GH₵) *</Label>
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                {...register('price', { required: 'Price is required', min: { value: 0.01, message: 'Must be > 0' } })}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" type="number" min="1" {...register('quantity', { required: true, min: 1 })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={5}
              placeholder="Describe condition, edition, pickup preference, and anything a buyer should know…"
              {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Min 10 characters' } })}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="imageUrl">Image URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="imageUrl" type="url" placeholder="https://…" {...register('imageUrl')} />
            {imageUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border border-border aspect-video bg-muted">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Listing status</Label>
            <Select value={selectedStatus} onValueChange={(v) => setValue('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published — visible to everyone</SelectItem>
                <SelectItem value="draft">Draft — save for later</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Updating…</> : <><Save size={16} /> Save changes</>}
          </Button>
        </form>
      </div>
    </div>
  )
}
