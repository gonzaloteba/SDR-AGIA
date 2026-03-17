import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { AlertList } from '@/components/alerts/alert-list'
import type { Alert } from '@/lib/types'

export default async function AlertsPage() {
  const supabase = await createClient()

  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('*, client:clients(first_name, last_name)')
    .order('is_resolved', { ascending: true })
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Failed to fetch alerts:', error.message)
  }

  return (
    <div>
      <Header title="Alertas" />
      <div className="p-6">
        <AlertList
          alerts={(alerts as (Alert & { client: { first_name: string; last_name: string } })[]) || []}
        />
      </div>
    </div>
  )
}
