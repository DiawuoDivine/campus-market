import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { fetchCategories, createCategory, deleteCategory } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

export function CategoryManagementPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [icon, setIcon] = useState('')
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 60_000,
  })

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setDialogOpen(false)
      setName(''); setSlug(''); setIcon('')
      toast({ title: 'Category created', variant: 'success' })
    },
    onError: (err: Error) => toast({ title: 'Failed', description: err.message, variant: 'error' }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast({ title: 'Category deleted', variant: 'success' })
    },
    onError: (err: Error) => toast({ title: 'Failed', description: err.message, variant: 'error' }),
  })

  function handleNameChange(val: string) {
    setName(val)
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage marketplace categories</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={16} className="mr-1" /> Add category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="pt-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.slug}{cat.icon ? ` · ${cat.icon}` : ''}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={deleteMut.isPending}
                  onClick={() => {
                    if (confirm(`Delete "${cat.name}"?`)) deleteMut.mutate(cat.id)
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Electronics" />
            </div>
            <div>
              <Label htmlFor="cat-slug">Slug</Label>
              <Input id="cat-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="electronics" />
            </div>
            <div>
              <Label htmlFor="cat-icon">Icon (optional)</Label>
              <Input id="cat-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="laptop" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!name || !slug || createMut.isPending}
              onClick={() => createMut.mutate({ name, slug, icon: icon || undefined })}
            >
              {createMut.isPending && <Loader2 size={14} className="animate-spin mr-1" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
