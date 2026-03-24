import { differenceInDays } from 'date-fns'
import type { HealthScore } from './types'

export function calculateHealthScore(opts: {
  unresolvedAlerts: number
  pendingCoachActions: number
  hasRecentCheckin: boolean
  hasPendingPhaseChange?: boolean
}): HealthScore {
  if (opts.unresolvedAlerts > 0 || opts.pendingCoachActions > 0 || !opts.hasRecentCheckin || opts.hasPendingPhaseChange) {
    return 'red'
  }
  return 'green'
}

export function getDaysRemaining(endDate: string): number {
  try {
    const parsed = new Date(endDate)
    if (isNaN(parsed.getTime())) return 0
    return Math.max(0, differenceInDays(parsed, new Date()))
  } catch {
    return 0
  }
}

/** Safely parse a date string, returning null if invalid */
export function safeParseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  try {
    const parsed = new Date(dateStr)
    return isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}
