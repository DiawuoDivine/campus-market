import { useQuery } from '@tanstack/react-query'
import {
  Users, ShoppingBag, Flag, TrendingUp, ShieldCheck, AlertTriangle,
} from 'lucide-react'
import { fetchAdminDashboard } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

function StatCard({ label, value, icon, highlight }: {
  label: string; value: number | string; icon: React.ReactNode; highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-destructive/30 bg-destructive/5' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${highlight ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    )
  }

  const stats = data!

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Marketplace overview and key metrics</p>
      </div>

      {stats.pendingReports > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-destructive" size={20} />
              <div>
                <p className="font-semibold">{stats.pendingReports} pending report{stats.pendingReports !== 1 ? 's' : ''}</p>
                <p className="text-sm text-muted-foreground">Requires moderation review</p>
              </div>
            </div>
            <Button size="sm" asChild>
              <Link to="/admin/moderation">Review now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total users" value={stats.totalUsers} icon={<Users size={22} />} />
        <StatCard label="Active users" value={stats.activeUsers} icon={<ShieldCheck size={22} />} />
        <StatCard label="Published listings" value={stats.publishedListings} icon={<ShoppingBag size={22} />} />
        <StatCard label="Sold listings" value={stats.soldListings} icon={<TrendingUp size={22} />} />
        <StatCard label="New this week" value={stats.newThisWeek} icon={<TrendingUp size={22} />} />
        <StatCard label="Pending reports" value={stats.pendingReports} icon={<Flag size={22} />} highlight={stats.pendingReports > 0} />
      </div>

      {stats.topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">{cat.count} listings</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
