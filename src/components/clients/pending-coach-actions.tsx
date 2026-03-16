'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, CheckCircle2, Loader2 } from 'lucide-react'
import { completeCoachActions } from '@/app/dashboard/clients/[id]/actions'
import type { Call } from '@/lib/types'

interface PendingCoachActionsProps {
  calls: Call[]
}

export function PendingCoachActions({ calls }: PendingCoachActionsProps) {
  const pendingCalls = useMemo(
    () => calls.filter((c) => c.coach_actions && !c.coach_actions_completed),
    [calls]
  )
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [completingId, setCompletingId] = useState<string | null>(null)
  const router = useRouter()

  const items = pendingCalls.filter((c) => !completedIds.has(c.id))

  async function handleComplete(callId: string) {
    setCompletingId(callId)
    const result = await completeCoachActions(callId)
    if (result.success) {
      setCompletedIds((prev) => new Set(prev).add(callId))
      router.refresh()
    }
    setCompletingId(null)
  }

  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-6 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-orange-800">
        <ClipboardList className="h-4 w-4" />
        Acciones del coach pendientes ({items.length})
      </h3>
      <div className="space-y-2">
        {items.map((call) => (
          <div
            key={call.id}
            className="flex items-start justify-between rounded-lg border bg-white px-4 py-3 gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">
                Llamada del{' '}
                {new Date(call.call_date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-sm whitespace-pre-wrap">{call.coach_actions}</p>
            </div>
            <button
              onClick={() => handleComplete(call.id)}
              disabled={completingId === call.id}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shrink-0"
            >
              {completingId === call.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Completar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
