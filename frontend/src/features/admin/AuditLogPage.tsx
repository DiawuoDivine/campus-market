import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AuditLogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => fetchAuditLogs({ limit: 50 }),
    staleTime: 30_000,
  })

  const logs = data?.data ?? []

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Record of admin actions</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-4 font-semibold">Time</th>
                    <th className="p-4 font-semibold">Admin</th>
                    <th className="p-4 font-semibold">Action</th>
                    <th className="p-4 font-semibold">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">{log.adminName ?? log.adminId.slice(0, 8)}</td>
                      <td className="p-4 font-medium">{log.action}</td>
                      <td className="p-4 text-muted-foreground">
                        {log.targetType ? `${log.targetType}${log.targetId ? `: ${log.targetId.slice(0, 8)}…` : ''}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && (
                <p className="p-8 text-center text-muted-foreground">No audit log entries yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
