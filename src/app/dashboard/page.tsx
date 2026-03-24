export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { ClientHealthChart } from '@/components/dashboard/client-health-chart'
import { PhaseDistribution } from '@/components/dashboard/phase-distribution'
import { CoachSelector } from '@/components/dashboard/coach-selector'
import { UpcomingCalls } from '@/components/dashboard/upcoming-calls'
import { startOfMonth, differenceInDays } from 'date-fns'
import { getCurrentCoach, isAdmin } from '@/lib/auth'
import { CHECKIN_GRACE_DAYS } from '@/lib/constants'
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
    clientsQuery.or(`coach_id.eq.${filterCoachId},coach_id.is.null`)
  }

  const allClientsQuery = supabase.from('clients').select('status').in('status', ['active', 'completed', 'cancelled'])
  if (filterCoachId) {
    allClientsQuery.or(`coach_id.eq.${filterCoachId},coach_id.is.null`)
  }

  const safe = <T,>(promise: PromiseLike<{ data: T | null; error: unknown }>): Promise<{ data: T | null }> =>
    Promise.resolve(promise).then(r => ({ data: r.data })).catch(() => ({ data: null }))

  // Fetch upcoming scheduled calls (next 7 days)
  const upcomingCallsQuery = supabase
    .from('calls')
    .select('id, client_id, call_date, scheduled_at, meet_link, calendly_event_uri')
    .not('scheduled_at', 'is', null)
    .gte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(10)

  const [clientsResult, checkinsResult, callsResult, alertsResult, allClientsResult, coachActionsResult, upcomingCallsResult] = await Promise.all([
    safe(clientsQuery),
    safe(supabase
      .from('check_ins')
      .select('client_id, submitted_at')
      .order('submitted_at', { ascending: false })),
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
    safe(upcomingCallsQuery),
  ])

  const clients = clientsResult.data
  const allCheckins = checkinsResult.data
  const pendingAlerts = alertsResult.data
  const allClients = allClientsResult.data
  const pendingCoachActions = coachActionsResult.data

  // Build last check-in date per client
  const lastCheckinByClient = new Map<string, string>()
  for (const ci of allCheckins || []) {
    if (!lastCheckinByClient.has(ci.client_id)) {
      lastCheckinByClient.set(ci.client_id, ci.submitted_at)
    }
  }

  // Build upcoming calls with client names
  const rawUpcomingCalls = (upcomingCallsResult.data || []) as {
    id: string
    client_id: string
    call_date: string
    scheduled_at: string
    meet_link: string | null
    calendly_event_uri: string | null
  }[]

  const activeClients = clients || []
  const activeClientIds = new Set(activeClients.map(c => c.id))

  // Check-in is "recent" if last submission was within CHECKIN_GRACE_DAYS (15 days)
  const recentCheckinClientIds = new Set<string>()
  for (const [clientId, submittedAt] of lastCheckinByClient) {
    const daysSince = differenceInDays(now, new Date(submittedAt))
    if (daysSince < CHECKIN_GRACE_DAYS) {
      recentCheckinClientIds.add(clientId)
    }
  }

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
    const hasIssue = alertClientIds.has(client.id) || coachActionClientIds.has(client.id) || !recentCheckinClientIds.has(client.id)
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

  // Resolve client names for upcoming calls
  const clientMap = new Map(activeClients.map(c => [c.id, { first_name: c.first_name, last_name: c.last_name }]))
  const upcomingCalls = rawUpcomingCalls
    .filter(c => activeClientIds.has(c.client_id))
    .map(call => ({
      ...call,
      client: clientMap.get(call.client_id) || { first_name: 'Cliente', last_name: 'desconocido' },
    }))

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
          checkinsOnTime={recentCheckinClientIds.size}
          expectedCheckins={activeClients.length}
          retentionRate={retentionRate}
        />

        <UpcomingCalls calls={upcomingCalls} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ClientHealthChart green={green} red={red} />
          <PhaseDistribution distribution={phaseDistribution} />
        </div>
      </div>
    </div>
  )
}
