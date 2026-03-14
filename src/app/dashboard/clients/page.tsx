import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ClientTable } from '@/components/clients/client-table'
import { calculateHealthScore, getDaysRemaining } from '@/lib/health-score'
import { startOfMonth } from 'date-fns'
import type { ClientWithHealth } from '@/lib/types'

export default async function ClientsPage() {
  const supabase = await createClient()
  const monthStart = startOfMonth(new Date()).toISOString()

  const [
    { data: clients },
    { data: latestCheckins },
    { data: callsThisMonth },
    { data: unresolvedAlerts },
    { data: pendingCoachActions },
  ] = await Promise.all([
    supabase.from('clients').select('*').order('first_name'),
    supabase
      .from('check_ins')
      .select('client_id, submitted_at')
      .order('submitted_at', { ascending: false }),
    supabase
      .from('calls')
      .select('client_id')
      .gte('call_date', monthStart),
    supabase
      .from('alerts')
      .select('client_id')
      .eq('is_resolved', false),
    supabase
      .from('calls')
      .select('client_id')
      .not('coach_actions', 'is', null)
      .eq('coach_actions_completed', false),
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
  const enrichedClients: ClientWithHealth[] = (clients || []).map((client) => {
    const lastCheckinDate = lastCheckinByClient.get(client.id) || null
    const callsCount = callCountByClient.get(client.id) || 0
    const alertCount = alertCountByClient.get(client.id) || 0

    return {
      ...client,
      health_score: calculateHealthScore(alertCount),
      last_checkin_date: lastCheckinDate,
      calls_this_month: callsCount,
      days_remaining: getDaysRemaining(client.end_date),
      pending_coach_actions: coachActionsCountByClient.get(client.id) || 0,
    }
  })

  return (
    <div>
      <Header title="Clientes" />
      <div className="p-6">
        <ClientTable clients={enrichedClients} />
      </div>
    </div>
  )
}
