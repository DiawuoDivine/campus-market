import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Loader2, ShieldCheck, ShieldOff, UserX } from 'lucide-react'
import { fetchAdminUsers, updateAdminUser } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/cn'

const STATUS_COLORS: Record<string, string> = {
  active:               'bg-emerald-100 text-emerald-800',
  suspended:            'bg-amber-100   text-amber-800',
  banned:               'bg-red-100     text-red-800',
  pending_verification: 'bg-blue-100    text-blue-800',
}

export function UserManagementPage() {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, statusFilter],
    queryFn: () => fetchAdminUsers({
      search: search || undefined,
      status: statusFilter || undefined,
      limit: 50,
    }),
    staleTime: 15_000,
  })

  const mutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string; role?: string; status?: string }) =>
      updateAdminUser(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast({ title: 'User updated', variant: 'success' })
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  })

  const users = data?.data ?? []

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage roles and account status</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, email, or index number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <NativeSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
          <option value="pending_verification">Pending</option>
        </NativeSelect>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">Index</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {u.indexNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs font-bold px-2.5 py-1 rounded-full capitalize whitespace-nowrap',
                          STATUS_COLORS[u.status] ?? 'bg-gray-100 text-gray-700',
                        )}>
                          {u.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <NativeSelect
                          value={u.role}
                          onChange={(e) => mutation.mutate({ id: u.id, role: e.target.value })}
                          className="w-28 h-8 text-xs"
                          disabled={mutation.isPending}
                        >
                          <option value="student">Student</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </NativeSelect>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.status !== 'active' && (
                            <button
                              onClick={() => mutation.mutate({ id: u.id, status: 'active' })}
                              disabled={mutation.isPending}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                            >
                              <ShieldCheck size={12} /> Activate
                            </button>
                          )}
                          {u.status !== 'suspended' && (
                            <button
                              onClick={() => mutation.mutate({ id: u.id, status: 'suspended' })}
                              disabled={mutation.isPending}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition disabled:opacity-50"
                            >
                              <ShieldOff size={12} /> Suspend
                            </button>
                          )}
                          {u.status !== 'banned' && (
                            <button
                              onClick={() => mutation.mutate({ id: u.id, status: 'banned' })}
                              disabled={mutation.isPending}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                            >
                              <UserX size={12} /> Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
