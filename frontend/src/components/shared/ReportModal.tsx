import { useState } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { createReport } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { useToast } from '@/components/ui/toast'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

const REASONS = [
  'Spam or fake listing',
  'Prohibited or illegal item',
  'Misleading description',
  'Wrong price / scam',
  'Inappropriate content',
  'Item already sold',
  'Harassment or abuse',
  'Other',
]

interface Props {
  open: boolean
  onClose: () => void
  targetType: 'listing' | 'user'
  targetId: string
  targetName?: string
}

export function ReportModal({ open, onClose, targetType, targetId, targetName }: Props) {
  const { isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [reason, setReason] = useState(REASONS[0]!)
  const [details, setDetails] = useState('')

  const mutation = useMutation({
    mutationFn: () => createReport({
      targetType,
      targetId,
      reason: details ? `${reason}: ${details}` : reason,
    }),
    onSuccess: () => {
      toast({ title: 'Report submitted', description: 'Our moderators will review it shortly.', variant: 'success' })
      setDetails('')
      setReason(REASONS[0]!)
      onClose()
    },
    onError: (err: Error) => toast({ title: 'Failed to submit', description: err.message, variant: 'error' }),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn()) { onClose(); navigate('/login'); return }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Flag size={18} />
            Report {targetType === 'listing' ? 'listing' : 'user'}
            {targetName && <span className="font-normal text-foreground truncate">— {targetName}</span>}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="font-semibold">Reason</Label>
            <NativeSelect value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold">
              Additional details <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              rows={3}
              placeholder="Provide any extra context that will help us review this report…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{details.length}/500</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            Reports are reviewed by our moderation team. False reports may result in account restrictions.
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={mutation.isPending}
              className="gap-2"
            >
              {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
              Submit report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
