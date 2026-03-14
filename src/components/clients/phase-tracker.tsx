'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PHASE_LABELS, PHASE_DURATIONS_DAYS, PHASE_ALERT_DAYS_BEFORE } from '@/lib/constants'
import { differenceInDays } from 'date-fns'
import { AlertTriangle, Clock, Pencil, Check, X } from 'lucide-react'
import type { NutritionPhase } from '@/lib/types'

interface PhaseTrackerProps {
  clientId: string
  currentPhase: NutritionPhase
  startDate: string
  endDate: string
  phaseChangeDate: string | null
  customPhaseDurationDays: number | null
}

export function PhaseTracker({ clientId, currentPhase, startDate, endDate, phaseChangeDate, customPhaseDurationDays }: PhaseTrackerProps) {
  const phases: NutritionPhase[] = [1, 2, 3]
  const now = new Date()
  const totalDays = Math.max(1, Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
  ))
  const elapsed = Math.max(0, Math.round(
    (now.getTime() - new Date(startDate).getTime()) / 86400000
  ))
  const progress = Math.min(100, Math.round((elapsed / totalDays) * 100))

  // Calculate days until phase change
  let daysUntilPhaseChange: number | null = null
  let nextPhase: NutritionPhase | null = null
  if (phaseChangeDate && currentPhase < 3) {
    daysUntilPhaseChange = differenceInDays(new Date(phaseChangeDate), now)
    nextPhase = (currentPhase + 1) as NutritionPhase
  }

  const showAlert = daysUntilPhaseChange !== null && daysUntilPhaseChange >= 0 && daysUntilPhaseChange <= PHASE_ALERT_DAYS_BEFORE
  const isUrgent = daysUntilPhaseChange !== null && daysUntilPhaseChange <= 1

  // Editable interval state
  const defaultDuration = PHASE_DURATIONS_DAYS[currentPhase]
  const currentDuration = customPhaseDurationDays ?? defaultDuration
  const [editing, setEditing] = useState(false)
  const [intervalValue, setIntervalValue] = useState(String(currentDuration))
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function saveInterval() {
    const days = parseInt(intervalValue, 10)
    if (isNaN(days) || days < 1) return

    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/phase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_phase_duration_days: days === defaultDuration ? null : days,
        }),
      })
      if (res.ok) {
        setEditing(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Progreso del Programa</h3>

      {/* Phase change alert banner */}
      {showAlert && nextPhase && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border p-3',
            isUrgent
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {daysUntilPhaseChange === 0
                ? `Cambio a ${PHASE_LABELS[nextPhase]} - HOY`
                : daysUntilPhaseChange === 1
                  ? `Cambio a ${PHASE_LABELS[nextPhase]} - MAÑANA`
                  : `Cambio a ${PHASE_LABELS[nextPhase]} en ${daysUntilPhaseChange} días`}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              Preparar indicaciones para la siguiente fase de alimentación
            </p>
          </div>
          <Clock className="h-4 w-4 shrink-0 opacity-60" />
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Día {elapsed} de {totalDays}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex gap-2">
        {phases.map((phase) => {
          const isCurrentPhase = phase === currentPhase
          const daysInPhase = isCurrentPhase && customPhaseDurationDays
            ? customPhaseDurationDays
            : PHASE_DURATIONS_DAYS[phase]

          return (
            <div
              key={phase}
              className={cn(
                'flex-1 rounded-lg border p-3 text-center text-xs',
                isCurrentPhase
                  ? 'border-primary bg-primary/5 font-medium'
                  : phase < currentPhase
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'text-muted-foreground'
              )}
            >
              {PHASE_LABELS[phase]}
              <p className="mt-1 text-muted-foreground text-[10px]">
                {daysInPhase} días
                {isCurrentPhase && customPhaseDurationDays && (
                  <span className="ml-1 text-primary">(personalizado)</span>
                )}
              </p>
              {isCurrentPhase && phaseChangeDate && currentPhase < 3 && (
                <p className="mt-1 text-muted-foreground">
                  Cambio: {new Date(phaseChangeDate).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Editable interval for current phase */}
      {currentPhase < 3 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              Intervalo hasta siguiente cambio de fase
            </p>
            {editing ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={1}
                  value={intervalValue}
                  onChange={(e) => setIntervalValue(e.target.value)}
                  className="w-20 rounded-md border px-2 py-1 text-sm"
                  disabled={saving}
                />
                <span className="text-sm text-muted-foreground">días</span>
                <button
                  type="button"
                  onClick={saveInterval}
                  disabled={saving}
                  className="rounded-md p-1 text-green-600 hover:bg-green-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setIntervalValue(String(currentDuration))
                  }}
                  className="rounded-md p-1 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium">{currentDuration} días</span>
                {customPhaseDurationDays && (
                  <span className="text-[10px] text-primary">(personalizado)</span>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          {daysUntilPhaseChange !== null && daysUntilPhaseChange >= 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Faltan</p>
              <p className="text-lg font-bold">{daysUntilPhaseChange}d</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
