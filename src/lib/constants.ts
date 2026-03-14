import type { AlertSeverity, AlertType, ClientStatus, NutritionPhase } from './types'

export const PHASE_LABELS: Record<NutritionPhase, string> = {
  1: 'Fase 1 - Detox',
  2: 'Fase 2 - Reintroducción',
  3: 'Fase 3 - Low-Carb Flexible',
}

export const PHASE_DURATIONS_DAYS: Record<NutritionPhase, number> = {
  1: 7,
  2: 30,
  3: 53, // remaining of 90 days
}

export const PHASE_ALERT_DAYS_BEFORE = 3

export const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Activo',
  completed: 'Concluido',
  renewed: 'Renovado',
  cancelled: 'Cancelado',
  success_case: 'Caso de Éxito',
}

export const STATUS_COLORS: Record<ClientStatus, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  renewed: 'bg-teal-100 text-teal-800',
  cancelled: 'bg-red-100 text-red-800',
  success_case: 'bg-purple-100 text-purple-800',
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  missed_checkin: 'Check-in perdido',
  phase_change: 'Cambio de fase',
  renewal_approaching: 'Renovación próxima',
  training_plan_expiring: 'Plan de entrenamiento por vencer',
  no_call_logged: 'Llamada no registrada',
  onboarding_incomplete: 'Onboarding incompleto',
  program_ending: 'Programa por terminar',
}

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
}

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

export const HEALTH_COLORS = {
  green: 'bg-green-500',
  red: 'bg-red-500',
} as const

export const CALLS_PER_MONTH = 3
export const PROGRAM_DURATION_DAYS = 90
export const RENEWAL_ALERT_DAYS = 21
export const TRAINING_PLAN_ALERT_DAYS = 7
export const CHECKIN_GRACE_DAYS = 8
