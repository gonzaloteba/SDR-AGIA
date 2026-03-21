'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, CheckCircle2, Loader2, Square, CheckSquare } from 'lucide-react'
import { completeCoachActions, toggleCoachActionItem } from '@/app/dashboard/clients/[id]/actions'
import type { Call } from '@/lib/types'

interface PendingCoachActionsProps {
  calls: Call[]
}

/** Split coach_actions text into individual non-empty lines */
function parseActionItems(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function PendingCoachActions({ calls }: PendingCoachActionsProps) {
  const pendingCalls = useMemo(
    () => calls.filter((c) => c.coach_actions && !c.coach_actions_completed),
    [calls]
  )
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [completingAllId, setCompletingAllId] = useState<string | null>(null)
  const [togglingItem, setTogglingItem] = useState<string | null>(null) // "callId-index"
  const [localCompletedItems, setLocalCompletedItems] = useState<Record<string, Set<number>>>({})
  const router = useRouter()

  const items = pendingCalls.filter((c) => !completedIds.has(c.id))

  function getCompletedItemsForCall(call: Call): Set<number> {
    if (localCompletedItems[call.id]) return localCompletedItems[call.id]
    return new Set(call.coach_actions_completed_items || [])
  }

  async function handleCompleteAll(callId: string) {
    setCompletingAllId(callId)
    const result = await completeCoachActions(callId)
    if (result.success) {
      setCompletedIds((prev) => new Set(prev).add(callId))
      router.refresh()
    }
    setCompletingAllId(null)
  }

  async function handleToggleItem(call: Call, index: number, currentlyCompleted: boolean) {
    const key = `${call.id}-${index}`
    setTogglingItem(key)

    const newCompleted = !currentlyCompleted
    const result = await toggleCoachActionItem(call.id, index, newCompleted)

    if (result.success) {
      setLocalCompletedItems((prev) => {
        const current = new Set(prev[call.id] || call.coach_actions_completed_items || [])
        if (newCompleted) {
          current.add(index)
        } else {
          current.delete(index)
        }
        return { ...prev, [call.id]: current }
      })

      if (result.allCompleted) {
        setCompletedIds((prev) => new Set(prev).add(call.id))
      }

      router.refresh()
    }
    setTogglingItem(null)
  }

  if (items.length === 0) return null

  const totalPendingItems = items.reduce((count, call) => {
    const actionItems = parseActionItems(call.coach_actions!)
    const completedSet = getCompletedItemsForCall(call)
    return count + actionItems.filter((_, i) => !completedSet.has(i)).length
  }, 0)

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-6 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-orange-800">
        <ClipboardList className="h-4 w-4" />
        Acciones del coach pendientes ({totalPendingItems})
      </h3>
      <div className="space-y-3">
        {items.map((call) => {
          const actionItems = parseActionItems(call.coach_actions!)
          const completedSet = getCompletedItemsForCall(call)
          const pendingCount = actionItems.filter((_, i) => !completedSet.has(i)).length
          const isCompletingAll = completingAllId === call.id

          return (
            <div
              key={call.id}
              className="rounded-lg border bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">
                  Llamada del{' '}
                  {new Date(call.call_date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                {actionItems.length > 1 && pendingCount > 0 && (
                  <button
                    onClick={() => handleCompleteAll(call.id)}
                    disabled={isCompletingAll}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isCompletingAll ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Completar todas
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {actionItems.map((item, index) => {
                  const isItemCompleted = completedSet.has(index)
                  const itemKey = `${call.id}-${index}`
                  const isToggling = togglingItem === itemKey

                  return (
                    <button
                      key={index}
                      onClick={() => handleToggleItem(call, index, isItemCompleted)}
                      disabled={isToggling || isCompletingAll}
                      className="flex items-start gap-2 w-full text-left rounded-md px-2 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 group"
                    >
                      <span className="mt-0.5 shrink-0">
                        {isToggling ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : isItemCompleted ? (
                          <CheckSquare className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground group-hover:text-orange-600" />
                        )}
                      </span>
                      <span
                        className={`text-sm ${
                          isItemCompleted
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {item.replace(/^[•\-\*]\s*/, '')}
                      </span>
                    </button>
                  )
                })}
              </div>
              {actionItems.length === 1 && pendingCount > 0 && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleCompleteAll(call.id)}
                    disabled={isCompletingAll}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isCompletingAll ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Completar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
