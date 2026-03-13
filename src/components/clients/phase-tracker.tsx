import { cn } from '@/lib/utils'
import { PHASE_LABELS, PHASE_DURATIONS_DAYS, PHASE_ALERT_DAYS_BEFORE } from '@/lib/constants'
import { differenceInDays } from 'date-fns'
import { AlertTriangle, Clock } from 'lucide-react'
import type { NutritionPhase } from '@/lib/types'

interface PhaseTrackerProps {
  currentPhase: NutritionPhase
  startDate: string
  endDate: string
  phaseChangeDate: string | null
}

function getPhaseEndDate(startDate: string, phase: NutritionPhase): Date {
  const start = new Date(startDate)
  if (phase === 1) {
    return new Date(start.getTime() + PHASE_DURATIONS_DAYS[1] * 86400000)
  }
  if (phase === 2) {
    return new Date(start.getTime() + (PHASE_DURATIONS_DAYS[1] + PHASE_DURATIONS_DAYS[2]) * 86400000)
  }
  return new Date(start.getTime() + 90 * 86400000)
}

export function PhaseTracker({ currentPhase, startDate, endDate, phaseChangeDate }: PhaseTrackerProps) {
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
          const phaseEnd = getPhaseEndDate(startDate, phase)
          const daysInPhase = PHASE_DURATIONS_DAYS[phase]

          return (
            <div
              key={phase}
              className={cn(
                'flex-1 rounded-lg border p-3 text-center text-xs',
                phase === currentPhase
                  ? 'border-primary bg-primary/5 font-medium'
                  : phase < currentPhase
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'text-muted-foreground'
              )}
            >
              {PHASE_LABELS[phase]}
              <p className="mt-1 text-muted-foreground text-[10px]">
                {daysInPhase} días
              </p>
              {phase === currentPhase && phaseChangeDate && currentPhase < 3 && (
                <p className="mt-1 text-muted-foreground">
                  Cambio: {new Date(phaseChangeDate).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
