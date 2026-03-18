import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { AlertList } from '@/components/alerts/alert-list'
import { CoachSelector } from '@/components/dashboard/coach-selector'
import { getCurrentCoach, isAdmin } from '@/lib/auth'
import type { Alert } from '@/lib/types'

interface Props {
  searchParams: Promise<{ coach?: string }>
}

export default async function AlertsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const coach = await getCurrentCoach()
  const admin = coach && isAdmin(coach)
  const { coach: selectedCoachId } = await searchParams

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

  // Determine which coach to filter by
  const filterCoachId = admin
    ? (selectedCoachId || null)
    : coach?.id ?? null

  // Get client IDs for the filtered coach
  let clientIds: string[] | null = null
  if (filterCoachId) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('coach_id', filterCoachId)
    clientIds = clients?.map(c => c.id) ?? []
  }

  const alertsQuery = supabase
    .from('alerts')
    .select('*, client:clients(first_name, last_name)')
    .order('is_resolved', { ascending: true })
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (clientIds !== null) {
    alertsQuery.in('client_id', clientIds.length > 0 ? clientIds : ['__none__'])
  }

  const { data: alerts, error } = await alertsQuery

  if (error) {
    // Error logged via Error Boundary if thrown; fallback to empty list
  }

  const selectedCoachName = admin && selectedCoachId
    ? coaches.find(c => c.id === selectedCoachId)?.full_name ?? null
    : null

  return (
    <div>
      <Header title={selectedCoachName ? `Alertas — ${selectedCoachName}` : 'Alertas'} />
      <div className="p-6 space-y-4">
        {admin && (
          <CoachSelector coaches={coaches} selectedCoachId={selectedCoachId ?? null} />
        )}
        <AlertList
          alerts={(alerts as (Alert & { client: { first_name: string; last_name: string } })[]) || []}
        />
      </div>
    </div>
  )
}
