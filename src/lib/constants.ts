import type { AlertSeverity, AlertType, ClientStatus, NutritionPhase } from './types'

export const PHASE_LABELS: Record<NutritionPhase, string> = {
  1: 'Fase 1 - Detox',
  2: 'Fase 2 - Reintroducción',
  3: 'Fase 3 - Optimización',
}

export const PHASE_DURATIONS_DAYS: Record<NutritionPhase, number> = {
  1: 7,
  2: 30,
  3: 53, // remaining of 90 days
}

export const PHASE_ALERT_DAYS_BEFORE = 1

export const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Concluido',
  cancelled: 'Cancelado',
}

export const STATUS_COLORS: Record<ClientStatus, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const BADGE_CONFIG = {
  renewed: { label: 'Renovado', colors: 'bg-teal-100 text-teal-800' },
  success_case: { label: 'Caso de Éxito', colors: 'bg-purple-100 text-purple-800' },
} as const

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  missed_checkin: 'Check-in perdido',
  phase_change: 'Cambio de fase',
  renewal_approaching: 'Renovación próxima',
  training_plan_expiring: 'Plan de entrenamiento por vencer',
  no_call_logged: 'Llamada no registrada',
  program_ending: 'Programa por terminar',
  birthday: 'Cumpleaños',
  upcoming_call: 'Llamada programada',
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

export const CALLS_PER_MONTH = 2
export const PROGRAM_DURATION_DAYS = 90
export const RENEWAL_ALERT_DAYS = 21
export const TRAINING_PLAN_ALERT_DAYS = 7
export const CHECKIN_GRACE_DAYS = 15
