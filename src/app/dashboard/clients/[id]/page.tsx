import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { PhaseTracker } from '@/components/clients/phase-tracker'
import { ClientDetailHeader } from '@/components/clients/client-detail-header'
import { ClientDetailTabs } from '@/components/clients/client-detail-tabs'
import { PendingAlerts } from '@/components/clients/pending-alerts'
import { PendingCoachActions } from '@/components/clients/pending-coach-actions'
import { notFound } from 'next/navigation'
import type { NutritionPhase } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch client first - if not found, show 404
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (clientError || !client) notFound()

  // Fetch related data with safe fallbacks - these are non-critical
  const safe = <T,>(promise: PromiseLike<{ data: T | null; error: unknown }>): Promise<{ data: T | null }> =>
    Promise.resolve(promise).then(r => ({ data: r.data })).catch(() => ({ data: null }))

  const [
    { data: checkIns },
    { data: calls },
    { data: trainingPlans },
    { data: alerts },
  ] = await Promise.all([
    safe(supabase
      .from('check_ins')
      .select('*')
      .eq('client_id', id)
      .order('submitted_at', { ascending: false })),
    safe(supabase
      .from('calls')
      .select('*')
      .eq('client_id', id)
      .order('call_date', { ascending: false })),
    safe(supabase
      .from('training_plans')
      .select('*')
      .eq('client_id', id)
      .order('start_date', { ascending: false })),
    safe(supabase
      .from('alerts')
      .select('*')
      .eq('client_id', id)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })),
  ])

  return (
    <div>
      <Header title={`${client.first_name} ${client.last_name}`} />
      <div className="p-6 space-y-6">
        <ClientDetailHeader client={client} alertCount={alerts?.length || 0} />

        <PendingAlerts alerts={alerts || []} />

        <PendingCoachActions calls={calls || []} />

        <PhaseTracker
          clientId={client.id}
          currentPhase={client.current_phase as NutritionPhase}
          startDate={client.start_date}
          endDate={client.end_date}
          phaseChangeDate={client.phase_change_date}
          customPhaseDurationDays={client.custom_phase_duration_days}
        />

        <ClientDetailTabs
          checkIns={checkIns || []}
          calls={calls || []}
          trainingPlans={trainingPlans || []}
          clientId={client.id}
          client={client}
        />
      </div>
    </div>
  )
}
