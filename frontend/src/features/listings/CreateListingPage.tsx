import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import { createListing, fetchCategories } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload, type UploadedImage } from '@/components/ui/image-upload'
import { useToast } from '@/components/ui/toast'

interface FormValues {
  title: string
  description: string
  price: number
  quantity: number
  condition: string
  categoryId: string
  status: string
}

export function CreateListingPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { quantity: 1, condition: 'used', status: 'published' },
  })

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const selectedCondition = watch('condition')
  const selectedStatus = watch('status')
  const selectedCategory = watch('categoryId')

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    setError('')
    try {
      const listing = await createListing({
        title: values.title,
        description: values.description,
        price: Math.round(values.price * 100),
        quantity: Number(values.quantity),
        condition: values.condition,
        categoryId: values.categoryId || undefined,
        status: values.status,
        images: images.map((img) => ({
          url: img.url,
          position: img.position,
          isPrimary: img.isPrimary,
        })),
      })
      toast({ title: 'Listing published!', description: values.title, variant: 'success' })
      navigate(`/listings/${listing.id}`)
    } catch (e) {
      setError((e as Error).message)
      toast({ title: 'Failed to publish', description: (e as Error).message, variant: 'error' })
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
        <p className="section-label mb-1">Sell on campus</p>
        <h1 className="font-serif text-3xl font-bold text-primary mb-1">Create a listing</h1>
        <p className="text-sm text-muted-foreground mb-7">
          Clear details and photos help your item sell faster.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Images */}
          <div className="space-y-2">
            <Label className="font-semibold">Photos</Label>
            <ImageUpload
              images={images}
              onChange={setImages}
              maxImages={8}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Upload from your device. First image (★) is the cover photo.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="font-semibold">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Calculus textbook, 8th edition"
              {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Min 3 characters' }, maxLength: { value: 120, message: 'Max 120 characters' } })}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-semibold">Category</Label>
              <Select value={selectedCategory} onValueChange={(v) => setValue('categoryId', v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Condition *</Label>
              <Select value={selectedCondition} onValueChange={(v) => setValue('condition', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[['new','New'],['like_new','Like new'],['used','Used'],['fair','Fair'],['poor','Poor']].map(([v,l]) => (
                    <SelectItem key={v} value={v!}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="font-semibold">Price (GH₵) *</Label>
              <Input
                id="price" type="number" min="0.01" step="0.01" placeholder="0.00"
                {...register('price', { required: 'Price is required', min: { value: 0.01, message: 'Must be > 0' } })}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="font-semibold">Quantity *</Label>
              <Input id="quantity" type="number" min="1" {...register('quantity', { required: true, min: 1 })} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="font-semibold">Description *</Label>
            <Textarea
              id="description" rows={5}
              placeholder="Describe condition, edition, pickup preference…"
              {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Min 10 characters' } })}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Listing status</Label>
            <Select value={selectedStatus} onValueChange={(v) => setValue('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published — visible to everyone</SelectItem>
                <SelectItem value="draft">Draft — save for later</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">{error}</div>
          )}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> Publishing…</>
              : <><Plus size={16} /> Publish listing</>}
          </Button>
        </form>
      </div>
    </div>
  )
}
