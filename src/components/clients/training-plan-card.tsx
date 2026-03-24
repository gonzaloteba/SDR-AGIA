'use client'

import { useState } from 'react'
import { Dumbbell, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { differenceInDays } from 'date-fns'
import { cn, inputClass, textareaClass } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import type { TrainingPlan } from '@/lib/types'

interface TrainingPlanCardProps {
  plans: TrainingPlan[]
  clientId: string
}

export function TrainingPlanCard({ plans, clientId }: TrainingPlanCardProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const currentPlan = plans.find(
    (p) => new Date(p.end_date) >= new Date()
  )
  const daysUntilExpiry = currentPlan
    ? differenceInDays(new Date(currentPlan.end_date), new Date())
    : null

  async function handleAddPlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createClient()

      const { error } = await supabase.from('training_plans').insert({
        client_id: clientId,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        plan_name: (formData.get('plan_name') as string) || null,
        notes: (formData.get('notes') as string) || null,
      })

      if (error) {
        toast('Error al guardar el plan. Inténtalo de nuevo.', 'error')
        return
      }

      setShowForm(false)
      router.refresh()
    } catch {
      toast('Error al guardar el plan. Inténtalo de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Plan de Entrenamiento
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3 w-3" />
          Nuevo plan
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddPlan} className="mb-4 space-y-3 rounded-lg border bg-muted/50 p-4">
          <div>
            <label className="block text-xs font-medium mb-1">Nombre del plan</label>
            <input name="plan_name" className={inputClass} placeholder="Ej: Hipertrofia Fase A" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium mb-1">Fecha inicio *</label>
              <input
                name="start_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Fecha fin *</label>
              <input name="end_date" type="date" required className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Notas</label>
            <textarea
              name="notes"
              rows={2}
              className={textareaClass}
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

      {currentPlan ? (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
            <p className="font-medium text-sm">{currentPlan.plan_name || 'Plan actual'}</p>
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {new Date(currentPlan.start_date).toLocaleDateString('es-ES')} -{' '}
              {new Date(currentPlan.end_date).toLocaleDateString('es-ES')}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                daysUntilExpiry !== null && daysUntilExpiry <= 7
                  ? 'bg-red-100 text-red-800'
                  : daysUntilExpiry !== null && daysUntilExpiry <= 14
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
              )}
            >
              {daysUntilExpiry} días restantes
            </span>
          </div>
          {currentPlan.notes && (
            <p className="mt-2 text-xs text-muted-foreground">{currentPlan.notes}</p>
          )}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Sin plan de entrenamiento activo
        </p>
      )}

      {/* Past plans */}
      {plans.filter((p) => new Date(p.end_date) < new Date()).length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Planes anteriores</p>
          <div className="space-y-1">
            {plans
              .filter((p) => new Date(p.end_date) < new Date())
              .map((plan) => (
                <div key={plan.id} className="flex items-center justify-between rounded p-2 text-xs text-muted-foreground">
                  <span>{plan.plan_name || 'Plan'}</span>
                  <span>
                    {new Date(plan.start_date).toLocaleDateString('es-ES')} -{' '}
                    {new Date(plan.end_date).toLocaleDateString('es-ES')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
