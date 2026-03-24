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

// Default durations when switching to a phase
const PHASE_DEFAULT_DAYS: Record<NutritionPhase, number | null> = {
  1: 7,
  2: 30,
  3: null, // indefinido
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
  const isIndefinite = customPhaseDurationDays === -1
  if (phaseChangeDate && currentPhase < 3 && !isIndefinite) {
    daysUntilPhaseChange = differenceInDays(new Date(phaseChangeDate), now)
    nextPhase = (currentPhase + 1) as NutritionPhase
  }

  const showAlert = daysUntilPhaseChange !== null && daysUntilPhaseChange >= 0 && daysUntilPhaseChange <= PHASE_ALERT_DAYS_BEFORE
  const isUrgent = daysUntilPhaseChange !== null && daysUntilPhaseChange <= 1

  // Interval display
  const effectiveDuration = isIndefinite ? null : (customPhaseDurationDays ?? (currentPhase === 3 ? null : PHASE_DURATIONS_DAYS[currentPhase]))
  const displayDuration = effectiveDuration ? `${effectiveDuration} días` : 'Indefinido'

  const [editing, setEditing] = useState(false)
  const [intervalValue, setIntervalValue] = useState(effectiveDuration ? String(effectiveDuration) : '')
  const [isIndefiniteInput, setIsIndefiniteInput] = useState(!effectiveDuration)
  const [saving, setSaving] = useState(false)
  const [changingPhase, setChangingPhase] = useState(false)
  const router = useRouter()

  async function handlePhaseClick(newPhase: NutritionPhase) {
    if (newPhase === currentPhase || changingPhase) return
    setChangingPhase(true)

    try {
      const defaultDays = PHASE_DEFAULT_DAYS[newPhase]
      const res = await fetch(`/api/clients/${clientId}/phase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: newPhase,
          custom_phase_duration_days: defaultDays === null ? -1 : undefined,
        }),
      })

      if (!res.ok) {
        console.error('Phase update failed:', await res.text())
      }

      router.refresh()
    } finally {
      setChangingPhase(false)
    }
  }

  async function saveInterval() {
    setSaving(true)

    try {
      const body: Record<string, unknown> = {}

      if (isIndefiniteInput) {
        body.custom_phase_duration_days = -1
      } else {
        const days = parseInt(intervalValue, 10)
        if (isNaN(days) || days < 1) {
          setSaving(false)
          return
        }
        body.custom_phase_duration_days = days
      }

      const res = await fetch(`/api/clients/${clientId}/phase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        console.error('Interval update failed:', await res.text())
      }

      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  // Display duration text for a phase box
  function phaseDurationLabel(phase: NutritionPhase): string {
    if (phase === currentPhase) {
      if (isIndefinite) return 'Indefinido'
      if (phase === 3 && customPhaseDurationDays === null) return 'Indefinido'
      if (customPhaseDurationDays && customPhaseDurationDays > 0) return `${customPhaseDurationDays} días`
      return `${PHASE_DURATIONS_DAYS[phase]} días`
    }
    if (phase === 3) return 'Indefinido'
    return `${PHASE_DURATIONS_DAYS[phase]} días`
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
          <button
            type="button"
            onClick={() => handlePhaseClick(nextPhase)}
            disabled={changingPhase}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              isUrgent
                ? 'bg-red-700 text-white hover:bg-red-800'
                : 'bg-amber-700 text-white hover:bg-amber-800',
              changingPhase && 'opacity-50'
            )}
          >
            {changingPhase ? 'Cambiando...' : 'Fase cambiada'}
          </button>
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

      {/* Clickable phase indicators */}
      <div className="flex gap-2">
        {phases.map((phase) => {
          const isCurrentPhase = phase === currentPhase
          const isCustom = isCurrentPhase && customPhaseDurationDays !== null && customPhaseDurationDays > 0

          return (
            <button
              key={phase}
              type="button"
              onClick={() => handlePhaseClick(phase)}
              disabled={changingPhase || isCurrentPhase}
              className={cn(
                'flex-1 rounded-lg border p-3 text-center text-xs transition-all',
                isCurrentPhase
                  ? 'border-primary bg-primary/5 font-medium ring-2 ring-primary/20'
                  : phase < currentPhase
                    ? 'border-green-200 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100 cursor-pointer'
                    : 'text-muted-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer',
                changingPhase && !isCurrentPhase && 'opacity-50',
                isCurrentPhase && 'cursor-default'
              )}
            >
              {PHASE_LABELS[phase]}
              <p className="mt-1 text-muted-foreground text-[10px]">
                {phaseDurationLabel(phase)}
                {isCustom && (
                  <span className="ml-1 text-primary">(personalizado)</span>
                )}
              </p>
              {isCurrentPhase && phaseChangeDate && !isIndefinite && currentPhase < 3 && (
                <p className="mt-1 text-muted-foreground">
                  Cambio: {new Date(phaseChangeDate).toLocaleDateString('es-ES')}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Editable interval */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            Intervalo hasta siguiente cambio de fase
          </p>
          {editing ? (
            <div className="flex items-center gap-2 mt-1">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={isIndefiniteInput}
                  onChange={(e) => setIsIndefiniteInput(e.target.checked)}
                  className="rounded"
                />
                Indefinido
              </label>
              {!isIndefiniteInput && (
                <>
                  <input
                    type="number"
                    min={1}
                    value={intervalValue}
                    onChange={(e) => setIntervalValue(e.target.value)}
                    className="w-20 rounded-md border px-2 py-1 text-sm"
                    disabled={saving}
                  />
                  <span className="text-sm text-muted-foreground">días</span>
                </>
              )}
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
                  setIntervalValue(effectiveDuration ? String(effectiveDuration) : '')
                  setIsIndefiniteInput(!effectiveDuration)
                }}
                className="rounded-md p-1 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium">{displayDuration}</span>
              {customPhaseDurationDays !== null && customPhaseDurationDays > 0 && (
                <span className="text-[10px] text-primary">(personalizado)</span>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditing(true)
                  setIntervalValue(effectiveDuration ? String(effectiveDuration) : '')
                  setIsIndefiniteInput(!effectiveDuration)
                }}
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
    </div>
  )
}
