export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { ClientHealthChart } from '@/components/dashboard/client-health-chart'
import { PhaseDistribution } from '@/components/dashboard/phase-distribution'
import { CoachSelector } from '@/components/dashboard/coach-selector'
import { startOfWeek, endOfWeek, startOfMonth } from 'date-fns'
import { getCurrentCoach, isAdmin } from '@/lib/auth'
import type { NutritionPhase } from '@/lib/types'

interface Props {
  searchParams: Promise<{ coach?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient()
  const coach = await getCurrentCoach()
  const admin = coach && isAdmin(coach)
  const { coach: selectedCoachId } = await searchParams
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const monthStart = startOfMonth(now).toISOString()

  // Fetch coach list for admin selector
  let coaches: { id: string; full_name: string }[] = []
  if (admin) {
    const { data } = await supabase
      .from('coaches')
      .select('id, full_name')
      .eq('role', 'coach')
      .order('full_name')
    coaches = data ?? []
  }

  // Determine which coach_id to filter by
  // Admin MUST select a coach to see data; coaches always see their own
  const filterCoachId = admin
    ? (selectedCoachId || null)
    : coach?.id ?? null

  // Admin without coach selected: show empty state
  if (admin && !filterCoachId) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="space-y-6 p-6">
          <CoachSelector coaches={coaches} selectedCoachId={null} />
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              Selecciona un coach para ver su dashboard
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Usa el selector de arriba para ver los datos de un coach espec&iacute;fico.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const clientsQuery = supabase.from('clients').select('*').eq('status', 'active')
  if (filterCoachId) {
    clientsQuery.eq('coach_id', filterCoachId)
  }

  const allClientsQuery = supabase.from('clients').select('status').in('status', ['active', 'completed', 'cancelled'])
  if (filterCoachId) {
    allClientsQuery.eq('coach_id', filterCoachId)
  }

  const safe = <T,>(promise: PromiseLike<{ data: T | null; error: unknown }>): Promise<{ data: T | null }> =>
    Promise.resolve(promise).then(r => ({ data: r.data })).catch(() => ({ data: null }))

  const [clientsResult, checkinsResult, callsResult, alertsResult, allClientsResult, coachActionsResult] = await Promise.all([
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
    safe(supabase
      .from('calls')
      .select('client_id')
      .not('coach_actions', 'is', null)
      .eq('coach_actions_completed', false)),
  ])

  const clients = clientsResult.data
  const checkinsThisWeek = checkinsResult.data
  const pendingAlerts = alertsResult.data
  const allClients = allClientsResult.data
  const pendingCoachActions = coachActionsResult.data

  const activeClients = clients || []
  const activeClientIds = new Set(activeClients.map(c => c.id))
  const checkinClientIds = new Set((checkinsThisWeek || []).map((c) => c.client_id))

  // Count unresolved alerts only for this coach's clients
  const filteredAlerts = (pendingAlerts || []).filter(a => activeClientIds.has(a.client_id))
  const alertClientIds = new Set(filteredAlerts.map((a) => a.client_id))

  // Clients with pending coach actions
  const coachActionClientIds = new Set(
    (pendingCoachActions || []).filter(a => activeClientIds.has(a.client_id)).map(a => a.client_id)
  )

  let green = 0
  let red = 0
  const phaseDistribution: Record<NutritionPhase, number> = { 1: 0, 2: 0, 3: 0 }

  for (const client of activeClients) {
    const hasIssue = alertClientIds.has(client.id) || coachActionClientIds.has(client.id) || !checkinClientIds.has(client.id)
    if (hasIssue) red++
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

  const selectedCoachName = admin && selectedCoachId
    ? coaches.find(c => c.id === selectedCoachId)?.full_name ?? null
    : null

  return (
    <div>
      <Header title={selectedCoachName ? `Dashboard — ${selectedCoachName}` : 'Dashboard'} />
      <div className="space-y-6 p-6">
        {admin && (
          <CoachSelector coaches={coaches} selectedCoachId={selectedCoachId ?? null} />
        )}
        <KpiCards
          activeClients={activeClients.length}
          checkinsThisWeek={checkinClientIds.size}
          expectedCheckins={activeClients.length}
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
