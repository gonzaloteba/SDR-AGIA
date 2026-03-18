import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ClientTable } from '@/components/clients/client-table'
import { CoachSelector } from '@/components/dashboard/coach-selector'
import { calculateHealthScore, getDaysRemaining } from '@/lib/health-score'
import { startOfMonth } from 'date-fns'
import { getCurrentCoach, isAdmin } from '@/lib/auth'
import type { ClientWithHealth } from '@/lib/types'

interface Props {
  searchParams: Promise<{ coach?: string }>
}

export default async function ClientsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const coach = await getCurrentCoach()
  const admin = coach && isAdmin(coach)
  const { coach: selectedCoachId } = await searchParams
  const monthStart = startOfMonth(new Date()).toISOString()

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

  const filterCoachId = admin
    ? (selectedCoachId || null)
    : coach?.id ?? null

  const clientsQuery = supabase.from('clients').select('*').order('first_name')
  if (filterCoachId) {
    clientsQuery.eq('coach_id', filterCoachId)
  }

  const safe = <T,>(promise: PromiseLike<{ data: T | null; error: unknown }>): Promise<{ data: T | null }> =>
    Promise.resolve(promise).then(r => ({ data: r.data })).catch(() => ({ data: null }))

  const [
    { data: clients },
    { data: latestCheckins },
    { data: callsThisMonth },
    { data: unresolvedAlerts },
    { data: pendingCoachActions },
  ] = await Promise.all([
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
      .select('client_id')
      .eq('is_resolved', false)),
    safe(supabase
      .from('calls')
      .select('client_id')
      .not('coach_actions', 'is', null)
      .eq('coach_actions_completed', false)),
  ])

  // Build lookup maps
  const lastCheckinByClient = new Map<string, string>()
  for (const checkin of latestCheckins || []) {
    if (!lastCheckinByClient.has(checkin.client_id)) {
      lastCheckinByClient.set(checkin.client_id, checkin.submitted_at)
    }
  }

  const callCountByClient = new Map<string, number>()
  for (const call of callsThisMonth || []) {
    callCountByClient.set(call.client_id, (callCountByClient.get(call.client_id) || 0) + 1)
  }

  // Count unresolved alerts per client
  const alertCountByClient = new Map<string, number>()
  for (const alert of unresolvedAlerts || []) {
    alertCountByClient.set(alert.client_id, (alertCountByClient.get(alert.client_id) || 0) + 1)
  }

  // Count pending coach actions per client
  const coachActionsCountByClient = new Map<string, number>()
  for (const action of pendingCoachActions || []) {
    coachActionsCountByClient.set(action.client_id, (coachActionsCountByClient.get(action.client_id) || 0) + 1)
  }

  // Enrich clients with health score
  const today = new Date()
  const enrichedClients: ClientWithHealth[] = (clients || []).map((client) => {
    const lastCheckinDate = lastCheckinByClient.get(client.id) || null
    const callsCount = callCountByClient.get(client.id) || 0
    const alertCount = alertCountByClient.get(client.id) || 0

    let isBirthdayToday = false
    if (client.birth_date) {
      const birth = new Date(client.birth_date + 'T12:00:00')
      isBirthdayToday = birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate()
    }

    return {
      ...client,
      health_score: calculateHealthScore(alertCount),
      last_checkin_date: lastCheckinDate,
      calls_this_month: callsCount,
      days_remaining: getDaysRemaining(client.end_date),
      pending_coach_actions: coachActionsCountByClient.get(client.id) || 0,
      is_birthday_today: isBirthdayToday,
    }
  })

  const birthdayClients = enrichedClients.filter((c) => c.is_birthday_today)

  const selectedCoachName = admin && selectedCoachId
    ? coaches.find(c => c.id === selectedCoachId)?.full_name ?? null
    : null

  return (
    <div>
      <Header title={selectedCoachName ? `Clientes — ${selectedCoachName}` : 'Clientes'} />
      <div className="p-6 space-y-4">
        {admin && (
          <CoachSelector coaches={coaches} selectedCoachId={selectedCoachId ?? null} />
        )}
        {birthdayClients.length > 0 && (
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4 flex items-center gap-3">
            <span className="text-2xl">🎂</span>
            <div>
              <p className="font-medium text-pink-900">
                ¡Cumpleaños hoy!
              </p>
              <p className="text-sm text-pink-700">
                {birthdayClients.map((c) => `${c.first_name} ${c.last_name}`).join(', ')}
                {' — '}No olvides felicitarle{birthdayClients.length > 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        )}
        <ClientTable clients={enrichedClients} />
      </div>
    </div>
  )
}
