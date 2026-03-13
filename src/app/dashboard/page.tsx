import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { ClientHealthChart } from '@/components/dashboard/client-health-chart'
import { PhaseDistribution } from '@/components/dashboard/phase-distribution'
import { AlertsSummary } from '@/components/dashboard/alerts-summary'
import { calculateHealthScore } from '@/lib/health-score'
import { startOfWeek, endOfWeek, startOfMonth } from 'date-fns'
import type { NutritionPhase, Alert } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const monthStart = startOfMonth(now).toISOString()

  // Fetch all data in parallel
  const [
    { data: clients },
    { data: checkinsThisWeek },
    { data: callsThisMonth },
    { data: pendingAlerts },
    { data: recentAlerts },
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
      .select('id')
      .eq('is_resolved', false),
    supabase
      .from('alerts')
      .select('*, client:clients(first_name, last_name)')
      .eq('is_resolved', false)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('clients')
      .select('status')
      .in('status', ['active', 'completed', 'renewed', 'success_case', 'cancelled']),
  ])

  const activeClients = clients || []
  const checkinClientIds = new Set((checkinsThisWeek || []).map((c) => c.client_id))
  const callCountByClient = new Map<string, number>()
  ;(callsThisMonth || []).forEach((c) => {
    callCountByClient.set(c.client_id, (callCountByClient.get(c.client_id) || 0) + 1)
  })

  // Calculate health scores
  let green = 0
  let yellow = 0
  let red = 0
  const phaseDistribution: Record<NutritionPhase, number> = { 1: 0, 2: 0, 3: 0 }

  for (const client of activeClients) {
    const score = calculateHealthScore(
      client,
      checkinClientIds.has(client.id) ? { submitted_at: now.toISOString() } as never : null,
      callCountByClient.get(client.id) || 0
    )
    if (score === 'green') green++
    else if (score === 'yellow') yellow++
    else red++

    phaseDistribution[client.current_phase as NutritionPhase] =
      (phaseDistribution[client.current_phase as NutritionPhase] || 0) + 1
  }

  // Retention rate
  const total = allClients?.length || 0
  const completed = allClients?.filter(
    (c) => c.status === 'completed' || c.status === 'success_case'
  ).length || 0
  const cancelled = allClients?.filter((c) => c.status === 'cancelled').length || 0
  const retentionRate = total > 0 ? Math.round(((total - cancelled) / total) * 100) : 100

  return (
    <div>
      <Header title="Dashboard" alertCount={pendingAlerts?.length || 0} />
      <div className="space-y-6 p-6">
        <KpiCards
          activeClients={activeClients.length}
          checkinsThisWeek={checkinClientIds.size}
          expectedCheckins={activeClients.length}
          pendingAlerts={pendingAlerts?.length || 0}
          retentionRate={retentionRate}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <ClientHealthChart green={green} yellow={yellow} red={red} />
          <PhaseDistribution distribution={phaseDistribution} />
        </div>

        <AlertsSummary alerts={(recentAlerts as (Alert & { client: { first_name: string; last_name: string } })[]) || []} />
      </div>
    </div>
  )
}
