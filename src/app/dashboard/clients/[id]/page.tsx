import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { PhaseTracker } from '@/components/clients/phase-tracker'
import { ClientDetailHeader } from '@/components/clients/client-detail-header'
import { ClientDetailTabs } from '@/components/clients/client-detail-tabs'
import { PendingAlerts } from '@/components/clients/pending-alerts'
import { notFound } from 'next/navigation'
import type { NutritionPhase } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: client },
    { data: checkIns },
    { data: calls },
    { data: trainingPlans },
    { data: alerts },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase
      .from('check_ins')
      .select('*')
      .eq('client_id', id)
      .order('submitted_at', { ascending: false }),
    supabase
      .from('calls')
      .select('*')
      .eq('client_id', id)
      .order('call_date', { ascending: false }),
    supabase
      .from('training_plans')
      .select('*')
      .eq('client_id', id)
      .order('start_date', { ascending: false }),
    supabase
      .from('alerts')
      .select('*')
      .eq('client_id', id)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false }),
  ])

  if (!client) notFound()

  return (
    <div>
      <Header title={`${client.first_name} ${client.last_name}`} />
      <div className="p-6 space-y-6">
        <ClientDetailHeader client={client} alertCount={alerts?.length || 0} />

        <PendingAlerts alerts={alerts || []} />

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
