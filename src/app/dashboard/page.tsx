import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { ClientHealthChart } from '@/components/dashboard/client-health-chart'
import { PhaseDistribution } from '@/components/dashboard/phase-distribution'
import { startOfWeek, endOfWeek, startOfMonth } from 'date-fns'
import type { NutritionPhase } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const monthStart = startOfMonth(now).toISOString()

  const [
    { data: clients },
    { data: checkinsThisWeek },
    { data: callsThisMonth },
    { data: pendingAlerts },
    { data: allClients },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('status', 'active'),
    supabase
      .from('check_ins')
      .select('client_id')
      .gte('submitted_at', weekStart)
      .lte('submitted_at', weekEnd),
    supabase
      .from('calls')
      .select('client_id')
      .gte('call_date', monthStart),
    supabase
      .from('alerts')
      .select('id, client_id')
      .eq('is_resolved', false),
    supabase
      .from('clients')
      .select('status')
      .in('status', ['active', 'completed', 'cancelled']),
  ])

  const activeClients = clients || []
  const checkinClientIds = new Set((checkinsThisWeek || []).map((c) => c.client_id))

  // Count unresolved alerts per active client
  const alertClientIds = new Set((pendingAlerts || []).map((a) => a.client_id))

  let green = 0
  let red = 0
  const phaseDistribution: Record<NutritionPhase, number> = { 1: 0, 2: 0, 3: 0 }

  for (const client of activeClients) {
    if (alertClientIds.has(client.id)) red++
    else green++

    phaseDistribution[client.current_phase as NutritionPhase] =
      (phaseDistribution[client.current_phase as NutritionPhase] || 0) + 1
  }

  // Retention rate
  const total = allClients?.length || 0
  const cancelled = allClients?.filter((c) => c.status === 'cancelled').length || 0
  const retentionRate = total > 0 ? Math.round(((total - cancelled) / total) * 100) : 100

  return (
    <div>
      <Header title="Dashboard" />
      <div className="space-y-6 p-6">
        <KpiCards
          activeClients={activeClients.length}
          checkinsThisWeek={checkinClientIds.size}
          expectedCheckins={activeClients.length}
          pendingAlerts={pendingAlerts?.length || 0}
          retentionRate={retentionRate}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <ClientHealthChart green={green} red={red} />
          <PhaseDistribution distribution={phaseDistribution} />
        </div>
      </div>
    </div>
  )
}
