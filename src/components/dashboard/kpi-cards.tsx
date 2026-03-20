import { Users, ClipboardCheck, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; positive: boolean }
}

function KpiCard({ title, value, subtitle, icon, trend }: KpiCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-muted p-2">{icon}</div>
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold">{value}</p>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <p
            className={cn(
              'mt-1 text-sm font-medium',
              trend.positive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.positive ? '+' : ''}{trend.value}% vs mes anterior
          </p>
        )}
      </div>
    </div>
  )
}

interface KpiCardsProps {
  activeClients: number
  checkinsThisWeek: number
  expectedCheckins: number
  retentionRate: number
}

export function KpiCards({
  activeClients,
  checkinsThisWeek,
  expectedCheckins,
  retentionRate,
}: KpiCardsProps) {
  const checkinRate = expectedCheckins > 0
    ? Math.round((checkinsThisWeek / expectedCheckins) * 100)
    : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Clientes Activos"
        value={activeClients}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
      <KpiCard
        title="Check-ins esta Semana"
        value={`${checkinsThisWeek}/${expectedCheckins}`}
        subtitle={`${checkinRate}% completado`}
        icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
      />
      <KpiCard
        title="Tasa de Retención"
        value={`${retentionRate}%`}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  )
}
