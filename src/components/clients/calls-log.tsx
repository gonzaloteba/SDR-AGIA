'use client'

import { useState } from 'react'
import { Phone, Plus, ChevronDown, ChevronUp, FileText, Video, ExternalLink, ClipboardList, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn, inputClass, textareaClass } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { completeCoachActions as completeCoachActionsAction } from '@/app/dashboard/clients/[id]/actions'
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
  const { toast } = useToast()

  async function handleAddCall(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from('calls').insert({
        client_id: clientId,
        coach_id: user?.id || null,
        call_date: formData.get('call_date') as string,
        duration_minutes: parseInt(formData.get('duration') as string) || 15,
        notes: (formData.get('notes') as string) || null,
        transcript: (formData.get('transcript') as string) || null,
        meet_link: (formData.get('meet_link') as string) || null,
        coach_actions: (formData.get('coach_actions') as string) || null,
      })

      if (error) {
        toast('Error al guardar la llamada. Inténtalo de nuevo.', 'error')
        return
      }

      setShowForm(false)
      router.refresh()
    } catch {
      toast('Error al guardar la llamada. Inténtalo de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteActions(callId: string) {
    setCompletingAction(callId)
    await completeCoachActionsAction(callId)
    setCompletingAction(null)
    router.refresh()
  }

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
              className={textareaClass}
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
              className={cn(textareaClass, 'font-mono text-xs')}
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
              className={textareaClass}
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
            const hasSummary = !!call.transcript_summary
            const hasTranscript = !!call.transcript
            const hasCoachActions = !!call.coach_actions
            const hasPositiveHighlights = !!call.positive_highlights
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
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {(hasSummary || hasTranscript) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          <FileText className="h-3 w-3" />
                          Resumen
                        </span>
                      )}
                      {hasPositiveHighlights && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                          <Sparkles className="h-3 w-3" />
                          Positivo
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
                    {hasSummary && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{call.transcript_summary}</p>
                    )}
                    {!hasSummary && call.notes && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{call.notes}</p>
                    )}
                  </div>
                  {(hasSummary || hasTranscript || call.notes || hasCoachActions || hasPositiveHighlights) && (
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
                    {hasSummary && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Resumen de la llamada
                        </p>
                        <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {call.transcript_summary}
                          </p>
                        </div>
                      </div>
                    )}
                    {hasPositiveHighlights && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                          Cosas positivas para seguimiento WhatsApp
                        </p>
                        <div className="rounded-lg bg-purple-50/50 border border-purple-100 p-3">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {call.positive_highlights}
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
                              onClick={() => handleCompleteActions(call.id)}
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
