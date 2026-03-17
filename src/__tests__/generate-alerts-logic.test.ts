/**
 * Tests for the alert generation logic used in /api/cron/generate-alerts.
 * We test the business rules in isolation without hitting Supabase.
 */
import { differenceInDays, getWeekOfMonth } from 'date-fns'

// Recreate the alert generation rules as pure functions for testing
type AlertInput = {
  client_id: string
  first_name: string
  last_name: string
  start_date: string
  end_date: string
  birth_date: string | null
  current_phase: number
  phase_change_date: string | null
  custom_phase_duration_days: number | null
}

type AlertCandidate = {
  client_id: string
  type: string
  severity: string
  message: string
}

function shouldCreateMissedCheckinAlert(
  client: AlertInput,
  lastCheckinDate: string | null,
  now: Date
): AlertCandidate | null {
  const daysSinceStart = differenceInDays(now, new Date(client.start_date))
  const daysSinceCheckin = lastCheckinDate
    ? differenceInDays(now, new Date(lastCheckinDate))
    : daysSinceStart

  if (daysSinceCheckin >= 8) {
    return {
      client_id: client.client_id,
      type: 'missed_checkin',
      severity: 'high',
      message: `${client.first_name} ${client.last_name} no ha enviado check-in en ${daysSinceCheckin} días`,
    }
  }
  return null
}

function shouldCreatePhaseChangeAlert(
  client: AlertInput,
  now: Date
): AlertCandidate | null {
  if (!client.phase_change_date || client.custom_phase_duration_days === -1) return null

  const daysUntilPhaseChange = differenceInDays(
    new Date(client.phase_change_date),
    now
  )
  const alertWindow = client.custom_phase_duration_days && client.custom_phase_duration_days > 0
    ? Math.min(3, client.custom_phase_duration_days)
    : 3

  if (daysUntilPhaseChange >= 0 && daysUntilPhaseChange <= alertWindow && client.current_phase < 3) {
    const phaseNames: Record<number, string> = {
      2: 'Fase 2 - Reintroducción',
      3: 'Fase 3 - Optimización',
    }
    const nextPhase = client.current_phase + 1
    return {
      client_id: client.client_id,
      type: 'phase_change',
      severity: daysUntilPhaseChange <= 1 ? 'high' : 'medium',
      message: expect.stringContaining(phaseNames[nextPhase] || `fase ${nextPhase}`) as unknown as string,
    }
  }
  return null
}

function shouldCreateRenewalAlert(
  client: AlertInput,
  now: Date
): AlertCandidate | null {
  const daysUntilEnd = differenceInDays(new Date(client.end_date), now)
  if (daysUntilEnd >= 0 && daysUntilEnd <= 21) {
    return {
      client_id: client.client_id,
      type: 'renewal_approaching',
      severity: 'medium',
      message: expect.stringContaining('renovación') as unknown as string,
    }
  }
  return null
}

function shouldCreateProgramEndingAlert(
  client: AlertInput,
  now: Date
): AlertCandidate | null {
  const daysUntilEnd = differenceInDays(new Date(client.end_date), now)
  if (daysUntilEnd >= 0 && daysUntilEnd <= 14) {
    return {
      client_id: client.client_id,
      type: 'program_ending',
      severity: 'low',
      message: expect.stringContaining('termina en') as unknown as string,
    }
  }
  return null
}

function shouldCreateBirthdayAlert(
  client: AlertInput,
  now: Date
): AlertCandidate | null {
  if (!client.birth_date) return null
  const birth = new Date(client.birth_date + 'T12:00:00')
  if (birth.getMonth() === now.getMonth() && birth.getDate() === now.getDate()) {
    const age = now.getFullYear() - birth.getFullYear()
    return {
      client_id: client.client_id,
      type: 'birthday',
      severity: 'low',
      message: expect.stringContaining('cumpleaños') as unknown as string,
    }
  }
  return null
}

function shouldCreateNoCallAlert(
  client: AlertInput,
  callsThisMonth: number,
  now: Date
): AlertCandidate | null {
  const weekOfMonth = getWeekOfMonth(now)
  if (weekOfMonth < 4) {
    const dayOfWeek = now.getDay()
    if (dayOfWeek >= 5 && callsThisMonth < weekOfMonth) {
      return {
        client_id: client.client_id,
        type: 'no_call_logged',
        severity: 'high',
        message: expect.stringContaining('llamadas') as unknown as string,
      }
    }
  }
  return null
}

// -------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------

const baseClient: AlertInput = {
  client_id: 'client-1',
  first_name: 'Juan',
  last_name: 'García',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  birth_date: '1990-06-15',
  current_phase: 1,
  phase_change_date: null,
  custom_phase_duration_days: null,
}

describe('Missed check-in alert', () => {
  it('triggers after 8 days without check-in', () => {
    const now = new Date('2024-06-10')
    const lastCheckin = '2024-06-01' // 9 days ago
    const alert = shouldCreateMissedCheckinAlert(baseClient, lastCheckin, now)
    expect(alert).not.toBeNull()
    expect(alert!.type).toBe('missed_checkin')
    expect(alert!.severity).toBe('high')
  })

  it('does not trigger within 7 days', () => {
    const now = new Date('2024-06-08')
    const lastCheckin = '2024-06-01' // 7 days ago
    const alert = shouldCreateMissedCheckinAlert(baseClient, lastCheckin, now)
    expect(alert).toBeNull()
  })

  it('uses days since start when no check-in exists', () => {
    const client = { ...baseClient, start_date: '2024-06-01' }
    const now = new Date('2024-06-10') // 9 days since start
    const alert = shouldCreateMissedCheckinAlert(client, null, now)
    expect(alert).not.toBeNull()
    expect(alert!.message).toContain('9 días')
  })

  it('does not trigger for recent start without check-in', () => {
    const client = { ...baseClient, start_date: '2024-06-05' }
    const now = new Date('2024-06-10') // 5 days since start
    const alert = shouldCreateMissedCheckinAlert(client, null, now)
    expect(alert).toBeNull()
  })
})

describe('Phase change alert', () => {
  it('triggers 3 days before phase change', () => {
    const client = {
      ...baseClient,
      phase_change_date: '2024-06-13',
      current_phase: 1,
    }
    const now = new Date('2024-06-10') // 3 days before
    const alert = shouldCreatePhaseChangeAlert(client, now)
    expect(alert).not.toBeNull()
    expect(alert!.type).toBe('phase_change')
    expect(alert!.severity).toBe('medium')
  })

  it('is high severity when 1 day or less', () => {
    const client = {
      ...baseClient,
      phase_change_date: '2024-06-11',
      current_phase: 1,
    }
    const now = new Date('2024-06-10') // 1 day before
    const alert = shouldCreatePhaseChangeAlert(client, now)
    expect(alert).not.toBeNull()
    expect(alert!.severity).toBe('high')
  })

  it('does not trigger for phase 3 (no next phase)', () => {
    const client = {
      ...baseClient,
      phase_change_date: '2024-06-13',
      current_phase: 3,
    }
    const now = new Date('2024-06-10')
    const alert = shouldCreatePhaseChangeAlert(client, now)
    expect(alert).toBeNull()
  })

  it('does not trigger when indefinite (-1)', () => {
    const client = {
      ...baseClient,
      phase_change_date: '2024-06-13',
      current_phase: 1,
      custom_phase_duration_days: -1,
    }
    const now = new Date('2024-06-10')
    const alert = shouldCreatePhaseChangeAlert(client, now)
    expect(alert).toBeNull()
  })

  it('does not trigger without phase_change_date', () => {
    const now = new Date('2024-06-10')
    const alert = shouldCreatePhaseChangeAlert(baseClient, now)
    expect(alert).toBeNull()
  })
})

describe('Renewal approaching alert', () => {
  it('triggers 21 days before end', () => {
    const client = { ...baseClient, end_date: '2024-06-30' }
    const now = new Date('2024-06-10') // 20 days before
    const alert = shouldCreateRenewalAlert(client, now)
    expect(alert).not.toBeNull()
    expect(alert!.type).toBe('renewal_approaching')
    expect(alert!.severity).toBe('medium')
  })

  it('does not trigger more than 21 days before', () => {
    const client = { ...baseClient, end_date: '2024-07-15' }
    const now = new Date('2024-06-10') // 35 days before
    const alert = shouldCreateRenewalAlert(client, now)
    expect(alert).toBeNull()
  })
})

describe('Program ending alert', () => {
  it('triggers 14 days before end', () => {
    const client = { ...baseClient, end_date: '2024-06-20' }
    const now = new Date('2024-06-10') // 10 days before
    const alert = shouldCreateProgramEndingAlert(client, now)
    expect(alert).not.toBeNull()
    expect(alert!.type).toBe('program_ending')
    expect(alert!.severity).toBe('low')
  })

  it('does not trigger more than 14 days before', () => {
    const client = { ...baseClient, end_date: '2024-06-30' }
    const now = new Date('2024-06-10') // 20 days before
    const alert = shouldCreateProgramEndingAlert(client, now)
    expect(alert).toBeNull()
  })
})

describe('Birthday alert', () => {
  it('triggers on birth date match (month and day)', () => {
    const client = { ...baseClient, birth_date: '1990-06-15' }
    const now = new Date('2024-06-15')
    const alert = shouldCreateBirthdayAlert(client, now)
    expect(alert).not.toBeNull()
    expect(alert!.type).toBe('birthday')
    expect(alert!.severity).toBe('low')
  })

  it('does not trigger on different day', () => {
    const client = { ...baseClient, birth_date: '1990-06-15' }
    const now = new Date('2024-06-14')
    const alert = shouldCreateBirthdayAlert(client, now)
    expect(alert).toBeNull()
  })

  it('does not trigger without birth_date', () => {
    const client = { ...baseClient, birth_date: null }
    const now = new Date('2024-06-15')
    const alert = shouldCreateBirthdayAlert(client, now)
    expect(alert).toBeNull()
  })
})

describe('No call logged alert', () => {
  it('triggers on Friday when calls behind', () => {
    // Friday June 14, 2024 - week 2 of month
    const now = new Date('2024-06-14') // Friday
    expect(now.getDay()).toBe(5) // Verify it's Friday
    const alert = shouldCreateNoCallAlert(baseClient, 0, now)
    // weekOfMonth should be 2, so expecting 2 calls, has 0
    expect(alert).not.toBeNull()
    expect(alert!.type).toBe('no_call_logged')
    expect(alert!.severity).toBe('high')
  })

  it('does not trigger on weekdays before Friday', () => {
    // Wednesday June 12, 2024
    const now = new Date('2024-06-12') // Wednesday
    expect(now.getDay()).toBe(3) // Verify it's Wednesday
    const alert = shouldCreateNoCallAlert(baseClient, 0, now)
    expect(alert).toBeNull()
  })

  it('does not trigger when calls are on track', () => {
    const now = new Date('2024-06-14') // Friday, week 2
    const weekOfMonth = getWeekOfMonth(now)
    const alert = shouldCreateNoCallAlert(baseClient, weekOfMonth, now)
    expect(alert).toBeNull()
  })
})
