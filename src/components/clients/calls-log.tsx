'use client'

import { useState } from 'react'
import { Phone, Plus, ChevronDown, ChevronUp, FileText, Video, ExternalLink, ClipboardList, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Call } from '@/lib/types'

interface CallsLogProps {
  calls: Call[]
  clientId: string
}

export function CallsLog({ calls, clientId }: CallsLogProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedCall, setExpandedCall] = useState<string | null>(null)
  const [completingAction, setCompletingAction] = useState<string | null>(null)
  const router = useRouter()

  async function handleAddCall(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const supabase = createClient()
    await supabase.from('calls').insert({
      client_id: clientId,
      call_date: formData.get('call_date') as string,
      duration_minutes: parseInt(formData.get('duration') as string) || 15,
      notes: (formData.get('notes') as string) || null,
      transcript: (formData.get('transcript') as string) || null,
      meet_link: (formData.get('meet_link') as string) || null,
      coach_actions: (formData.get('coach_actions') as string) || null,
    })

    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function completeCoachActions(callId: string) {
    setCompletingAction(callId)
    const supabase = createClient()
    await supabase
      .from('calls')
      .update({ coach_actions_completed: true })
      .eq('id', callId)
    setCompletingAction(null)
    router.refresh()
  }

  const inputClass =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Llamadas ({calls.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3 w-3" />
          Registrar llamada
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddCall} className="mb-4 space-y-3 rounded-lg border bg-muted/50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium mb-1">Fecha *</label>
              <input
                name="call_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Duración (min)</label>
              <input
                name="duration"
                type="number"
                defaultValue={15}
                min={1}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Link de Meet</label>
            <input
              name="meet_link"
              type="url"
              className={inputClass}
              placeholder="https://meet.google.com/..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Notas</label>
            <textarea
              name="notes"
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Resumen de la llamada..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Transcript (Gemini)
            </label>
            <textarea
              name="transcript"
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono text-xs"
              placeholder="Pega aquí el transcript de Gemini..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Acciones del coach
            </label>
            <textarea
              name="coach_actions"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ej: Actualizar plan de alimentación, enviar recetas batch cooking..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border px-4 py-2 text-xs font-medium hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {calls.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay llamadas registradas
          </p>
        ) : (
          calls.map((call) => {
            const isExpanded = expandedCall === call.id
            const hasTranscript = !!call.transcript
            const hasCoachActions = !!call.coach_actions
            const actionsPending = hasCoachActions && !call.coach_actions_completed

            return (
              <div key={call.id} className="rounded-lg border hover:border-primary/20 transition-colors">
                <button
                  type="button"
                  onClick={() => setExpandedCall(isExpanded ? null : call.id)}
                  className="flex w-full items-start gap-3 p-3 text-left"
                >
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {new Date(call.call_date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {call.duration_minutes} min
                      </span>
                      {hasTranscript && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          <FileText className="h-3 w-3" />
                          Transcript
                        </span>
                      )}
                      {call.meet_link && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          <Video className="h-3 w-3" />
                          Meet
                        </span>
                      )}
                      {hasCoachActions && (
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          actionsPending
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-emerald-100 text-emerald-700'
                        )}>
                          <ClipboardList className="h-3 w-3" />
                          {actionsPending ? 'Acciones pendientes' : 'Acciones completadas'}
                        </span>
                      )}
                    </div>
                    {call.notes && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{call.notes}</p>
                    )}
                  </div>
                  {(hasTranscript || call.notes || hasCoachActions) && (
                    isExpanded
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t px-3 pb-3 space-y-3">
                    {call.meet_link && (
                      <div className="pt-3">
                        <a
                          href={call.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Abrir en Google Meet
                        </a>
                      </div>
                    )}
                    {call.notes && (
                      <div className={cn(!call.meet_link && 'pt-3')}>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
                        <p className="text-sm whitespace-pre-wrap">{call.notes}</p>
                      </div>
                    )}
                    {hasTranscript && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Transcript de Gemini
                        </p>
                        <div className="max-h-80 overflow-y-auto rounded-lg bg-muted/50 p-3">
                          <p className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
                            {call.transcript}
                          </p>
                        </div>
                      </div>
                    )}
                    {hasCoachActions && (
                      <div className={cn(
                        'rounded-lg border p-3',
                        actionsPending
                          ? 'border-orange-200 bg-orange-50/50'
                          : 'border-emerald-200 bg-emerald-50/50'
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <p className={cn(
                            'text-xs font-medium flex items-center gap-1.5',
                            actionsPending ? 'text-orange-800' : 'text-emerald-800'
                          )}>
                            <ClipboardList className="h-3.5 w-3.5" />
                            Acciones del coach
                            {!actionsPending && (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" />
                                Completadas
                              </span>
                            )}
                          </p>
                          {actionsPending && (
                            <button
                              onClick={() => completeCoachActions(call.id)}
                              disabled={completingAction === call.id}
                              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                              {completingAction === call.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              Marcar completadas
                            </button>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{call.coach_actions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
