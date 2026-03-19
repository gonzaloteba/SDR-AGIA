'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle, Cake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ALERT_TYPE_LABELS, SEVERITY_COLORS, SEVERITY_LABELS } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'
import type { Alert } from '@/lib/types'

interface AlertListProps {
  alerts: (Alert & { client?: { first_name: string; last_name: string } })[]
}

export function AlertList({ alerts }: AlertListProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [showResolved, setShowResolved] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const filtered = useMemo(() => alerts.filter((alert) => {
    const matchesType = typeFilter === 'all' || alert.type === typeFilter
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
    const matchesResolved = showResolved || !alert.is_resolved
    return matchesType && matchesSeverity && matchesResolved
  }), [alerts, typeFilter, severityFilter, showResolved])

  async function resolveAlert(alertId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('alerts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId)
    if (error) {
      toast('No se pudo resolver la alerta.', 'error')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Todos los tipos</option>
          {Object.entries(ALERT_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Todas las severidades</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="rounded border-input"
          />
          Mostrar resueltas
        </label>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">
            No hay alertas {!showResolved ? 'pendientes' : ''}
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'rounded-xl border bg-card p-5 shadow-sm transition-colors',
                alert.is_resolved && 'opacity-60'
              )}
            >
              <div className="flex items-start gap-4">
                {alert.type === 'birthday' ? (
                  <Cake className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />
                ) : (
                  <AlertTriangle
                    className={cn(
                      'mt-0.5 h-5 w-5 shrink-0',
                      alert.severity === 'high'
                        ? 'text-red-500'
                        : alert.severity === 'medium'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                    )}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/dashboard/clients/${alert.client_id}`}
                      className="font-medium hover:underline"
                    >
                      {alert.client?.first_name} {alert.client?.last_name}
                    </Link>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        SEVERITY_COLORS[alert.severity]
                      )}
                    >
                      {SEVERITY_LABELS[alert.severity]}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {ALERT_TYPE_LABELS[alert.type]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(alert.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {!alert.is_resolved && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted shrink-0"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Resolver
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
