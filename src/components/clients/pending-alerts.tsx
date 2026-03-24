'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ALERT_TYPE_LABELS, SEVERITY_COLORS, SEVERITY_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import type { Alert } from '@/lib/types'

interface PendingAlertsProps {
  alerts: Alert[]
}

export function PendingAlerts({ alerts: initialAlerts }: PendingAlertsProps) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  async function resolveAlert(alertId: string) {
    setResolvingId(alertId)
    const supabase = createClient()
    const { error } = await supabase
      .from('alerts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId)

    if (error) {
      toast('No se pudo resolver la alerta.', 'error')
      setResolvingId(null)
      return
    }

    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    setResolvingId(null)
    router.refresh()
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-red-800">
        <AlertTriangle className="h-4 w-4" />
        Pendiente de resolver ({alerts.length})
      </h3>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                  SEVERITY_COLORS[alert.severity]
                )}
              >
                {SEVERITY_LABELS[alert.severity]}
              </span>
              <div>
                <p className="text-sm font-medium">{ALERT_TYPE_LABELS[alert.type]}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
            </div>
            <button
              onClick={() => resolveAlert(alert.id)}
              disabled={resolvingId === alert.id}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {resolvingId === alert.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Resolver
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
