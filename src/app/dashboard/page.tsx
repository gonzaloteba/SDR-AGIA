import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { ClientHealthChart } from '@/components/dashboard/client-health-chart'
import { PhaseDistribution } from '@/components/dashboard/phase-distribution'
import { startOfWeek, endOfWeek, startOfMonth } from 'date-fns'
import { getCurrentCoach, isAdmin } from '@/lib/auth'
import type { NutritionPhase } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const coach = await getCurrentCoach()
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const monthStart = startOfMonth(now).toISOString()

  // Coaches see only their clients; admins see all
  const clientsQuery = supabase.from('clients').select('*').eq('status', 'active')
  if (coach && !isAdmin(coach)) {
    clientsQuery.eq('coach_id', coach.id)
  }

  const allClientsQuery = supabase.from('clients').select('status').in('status', ['active', 'completed', 'cancelled'])
  if (coach && !isAdmin(coach)) {
    allClientsQuery.eq('coach_id', coach.id)
  }

  const safe = <T,>(promise: PromiseLike<{ data: T | null; error: unknown }>): Promise<{ data: T | null }> =>
    Promise.resolve(promise).then(r => ({ data: r.data })).catch(() => ({ data: null }))

  const [clientsResult, checkinsResult, callsResult, alertsResult, allClientsResult] = await Promise.all([
    safe(clientsQuery),
    safe(supabase
      .from('check_ins')
      .select('client_id')
      .gte('submitted_at', weekStart)
      .lte('submitted_at', weekEnd)),
    safe(supabase
      .from('calls')
      .select('client_id')
      .gte('call_date', monthStart)),
    safe(supabase
      .from('alerts')
      .select('id, client_id')
      .eq('is_resolved', false)),
    safe(allClientsQuery),
  ])

  const clients = clientsResult.data
  const checkinsThisWeek = checkinsResult.data
  const pendingAlerts = alertsResult.data
  const allClients = allClientsResult.data

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

    const phase = client.current_phase as NutritionPhase
    if (phase >= 1 && phase <= 3) {
      phaseDistribution[phase] = (phaseDistribution[phase] || 0) + 1
    }
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
