import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flag, Loader2, CheckCircle, XCircle, Trash2, UserX } from 'lucide-react'
import { fetchReports, updateReport } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/cn'

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800',
  reviewed:  'bg-blue-100  text-blue-800',
  dismissed: 'bg-gray-100  text-gray-700',
  actioned:  'bg-red-100   text-red-800',
}

export function ModerationQueuePage() {
  const [statusFilter, setStatusFilter] = useState('pending')
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: () => fetchReports({ status: statusFilter, limit: 50 }),
    staleTime: 15_000,
  })

  const mutation = useMutation({
    mutationFn: ({
      id, status, action,
    }: { id: string; status: string; action?: string }) =>
      updateReport(id, {
        status: status as 'reviewed' | 'dismissed' | 'actioned',
        action: action as 'none' | 'remove_listing' | 'suspend_user' | 'ban_user' | undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      toast({ title: 'Report updated', variant: 'success' })
    },
    onError: (err: Error) =>
      toast({ title: 'Action failed', description: err.message, variant: 'error' }),
  })

  const reports = data?.data ?? []

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Moderation Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">Review flagged listings and users</p>
        </div>
        <NativeSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
          <option value="actioned">Actioned</option>
        </NativeSelect>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Flag size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No {statusFilter} reports</p>
            <p className="text-sm mt-1">Everything looks clean here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardContent className="pt-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">{report.targetType}</Badge>
                      <span className={cn(
                        'text-xs font-bold px-2.5 py-0.5 rounded-full capitalize',
                        STATUS_COLORS[report.status],
                      )}>
                        {report.status}
                      </span>
                    </div>
                    <p className="font-semibold truncate">
                      {report.targetLabel ?? report.targetId}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reported by{' '}
                      <span className="font-medium">{report.reporterName ?? 'Unknown'}</span>
                      {' · '}
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button
                        size="sm" variant="outline"
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate({ id: report.id, status: 'dismissed', action: 'none' })}
                      >
                        <XCircle size={14} className="mr-1" /> Dismiss
                      </Button>

                      {report.targetType === 'listing' && (
                        <Button
                          size="sm" variant="destructive"
                          disabled={mutation.isPending}
                          onClick={() => mutation.mutate({ id: report.id, status: 'actioned', action: 'remove_listing' })}
                        >
                          {mutation.isPending
                            ? <Loader2 size={14} className="animate-spin mr-1" />
                            : <Trash2 size={14} className="mr-1" />}
                          Remove listing
                        </Button>
                      )}

                      {report.targetType === 'user' && (
                        <>
                          <Button
                            size="sm" variant="outline"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({ id: report.id, status: 'actioned', action: 'suspend_user' })}
                          >
                            <UserX size={14} className="mr-1" /> Suspend user
                          </Button>
                          <Button
                            size="sm" variant="destructive"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({ id: report.id, status: 'actioned', action: 'ban_user' })}
                          >
                            Ban user
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate({ id: report.id, status: 'reviewed', action: 'none' })}
                      >
                        <CheckCircle size={14} className="mr-1" /> Mark reviewed
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
