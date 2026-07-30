import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BadgeCheck, Star, MapPin, BookOpen, Edit3, Save,
  X, Loader2, ShoppingBag, ArrowLeft,
} from 'lucide-react'
import { fetchUser, updateProfile, fetchListings } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { ListingCard } from '@/features/listings/ListingCard'

export function ProfilePage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user: me, setAuth } = useAuthStore()
  const qc = useQueryClient()

  // If no id param, show own profile
  const targetId = id ?? me?.id
  const isOwn = !id || id === me?.id

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', campus: '', hostel: '', bio: '' })
  const [saveError, setSaveError] = useState('')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', targetId],
    queryFn: () => fetchUser(targetId!),
    enabled: Boolean(targetId),
  })

  const { data: listingsRes } = useQuery({
    queryKey: ['listings', { seller_id: targetId }],
    queryFn: () => fetchListings({ seller_id: targetId, limit: 12 }),
    enabled: Boolean(targetId),
  })

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      // Update the auth store so the navbar reflects changes immediately
      if (me && isOwn) setAuth({ ...me, ...updated }, me.id)
      qc.invalidateQueries({ queryKey: ['user', targetId] })
      setEditing(false)
    },
    onError: (err) => setSaveError((err as Error).message),
  })

  function startEdit() {
    setEditForm({
      fullName: profile?.fullName ?? '',
      campus: profile?.campus ?? '',
      hostel: profile?.hostel ?? '',
      bio: profile?.bio ?? '',
    })
    setSaveError('')
    setEditing(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(editForm)
  }

  const listings = listingsRes?.data ?? []
  const initials = profile?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  if (!targetId) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Please <a href="/login" className="text-primary underline">sign in</a> to view your profile.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-20 flex items-center justify-center text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading profile…
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="container py-8 pb-16 max-w-4xl">
      {id && (
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2 mb-6 text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Back
        </Button>
      )}

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-border p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <AvatarUpload
            currentUrl={profile.avatarUrl}
            name={profile.fullName}
            size="lg"
            disabled={!isOwn}
            onUploaded={(url) => {
              mutation.mutate({ avatarUrl: url })
            }}
          />

          <div className="flex-1 min-w-0">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="campus">Campus</Label>
                    <Input
                      id="campus"
                      value={editForm.campus}
                      placeholder="e.g. Main Campus"
                      onChange={(e) => setEditForm((f) => ({ ...f, campus: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="hostel">Hostel / Hall</Label>
                    <Input
                      id="hostel"
                      value={editForm.hostel}
                      placeholder="e.g. Unity Hall"
                      onChange={(e) => setEditForm((f) => ({ ...f, hostel: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={editForm.bio}
                    placeholder="A short intro…"
                    onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  />
                </div>
                {saveError && <p className="text-xs text-destructive">{saveError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="gap-1.5" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save changes
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-1.5">
                    <X size={14} /> Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-serif text-2xl font-bold text-primary">{profile.fullName}</h1>
                  {profile.isVerified && (
                    <span title="Verified student" className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold">
                      <BadgeCheck size={12} /> Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                  {profile.campus && <span className="flex items-center gap-1"><MapPin size={13} />{profile.campus}</span>}
                  {profile.hostel && <span className="flex items-center gap-1"><BookOpen size={13} />{profile.hostel}</span>}
                  {profile.ratingAvg > 0 && (
                    <span className="flex items-center gap-1">
                      <Star size={13} fill="currentColor" className="text-yellow-400" />
                      {profile.ratingAvg.toFixed(1)} · {profile.ratingCount} reviews
                    </span>
                  )}
                  {profile.createdAt && (
                    <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                  )}
                </div>
                {profile.bio && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{profile.bio}</p>}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {isOwn && (
                    <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
                      <Edit3 size={14} /> Edit profile
                    </Button>
                  )}
                  <Badge variant="outline" className="capitalize">{profile.role}</Badge>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Listings */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
          {isOwn ? 'Your listings' : `${profile.fullName.split(' ')[0]}'s listings`}
        </p>
        <h2 className="font-serif text-2xl font-bold text-primary mb-6">
          {listings.length} active {listings.length === 1 ? 'listing' : 'listings'}
        </h2>

        {listings.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <ShoppingBag size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {isOwn ? "You haven't listed anything yet." : 'No active listings.'}
            </p>
            {isOwn && (
              <Button size="sm" className="mt-4" onClick={() => navigate('/listings/new')}>
                Create your first listing
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} onClick={() => navigate(`/listings/${l.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
