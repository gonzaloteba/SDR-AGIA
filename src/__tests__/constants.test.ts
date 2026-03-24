import {
  PHASE_LABELS,
  PHASE_DURATIONS_DAYS,
  STATUS_LABELS,
  STATUS_COLORS,
  BADGE_CONFIG,
  ALERT_TYPE_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  HEALTH_COLORS,
  CALLS_PER_MONTH,
  PROGRAM_DURATION_DAYS,
  RENEWAL_ALERT_DAYS,
  TRAINING_PLAN_ALERT_DAYS,
  CHECKIN_GRACE_DAYS,
  PHASE_ALERT_DAYS_BEFORE,
} from '@/lib/constants'

describe('PHASE_LABELS', () => {
  it('has labels for all 3 phases', () => {
    expect(PHASE_LABELS[1]).toBeTruthy()
    expect(PHASE_LABELS[2]).toBeTruthy()
    expect(PHASE_LABELS[3]).toBeTruthy()
  })
})

describe('PHASE_DURATIONS_DAYS', () => {
  it('has durations for all 3 phases', () => {
    expect(PHASE_DURATIONS_DAYS[1]).toBeGreaterThan(0)
    expect(PHASE_DURATIONS_DAYS[2]).toBeGreaterThan(0)
    expect(PHASE_DURATIONS_DAYS[3]).toBeGreaterThan(0)
  })

  it('sums to program duration', () => {
    const total = PHASE_DURATIONS_DAYS[1] + PHASE_DURATIONS_DAYS[2] + PHASE_DURATIONS_DAYS[3]
    expect(total).toBe(PROGRAM_DURATION_DAYS)
  })
})

describe('STATUS_LABELS', () => {
  it('covers all client statuses', () => {
    expect(STATUS_LABELS.active).toBeTruthy()
    expect(STATUS_LABELS.completed).toBeTruthy()
    expect(STATUS_LABELS.cancelled).toBeTruthy()
  })
})

describe('STATUS_COLORS', () => {
  it('has CSS classes for all statuses', () => {
    expect(STATUS_COLORS.active).toContain('bg-')
    expect(STATUS_COLORS.completed).toContain('bg-')
    expect(STATUS_COLORS.cancelled).toContain('bg-')
  })
})

describe('ALERT_TYPE_LABELS', () => {
  it('covers all alert types', () => {
    expect(ALERT_TYPE_LABELS.missed_checkin).toBeTruthy()
    expect(ALERT_TYPE_LABELS.phase_change).toBeTruthy()
    expect(ALERT_TYPE_LABELS.renewal_approaching).toBeTruthy()
    expect(ALERT_TYPE_LABELS.training_plan_expiring).toBeTruthy()
    expect(ALERT_TYPE_LABELS.no_call_logged).toBeTruthy()
    expect(ALERT_TYPE_LABELS.program_ending).toBeTruthy()
    expect(ALERT_TYPE_LABELS.birthday).toBeTruthy()
    expect(ALERT_TYPE_LABELS.upcoming_call).toBeTruthy()
  })
})

describe('SEVERITY_COLORS and SEVERITY_LABELS', () => {
  it('covers all severity levels', () => {
    for (const severity of ['low', 'medium', 'high'] as const) {
      expect(SEVERITY_COLORS[severity]).toContain('bg-')
      expect(SEVERITY_LABELS[severity]).toBeTruthy()
    }
  })
})

describe('HEALTH_COLORS', () => {
  it('has colors for green and red', () => {
    expect(HEALTH_COLORS.green).toContain('bg-')
    expect(HEALTH_COLORS.red).toContain('bg-')
  })
})

describe('BADGE_CONFIG', () => {
  it('has renewed and success_case badges', () => {
    expect(BADGE_CONFIG.renewed.label).toBeTruthy()
    expect(BADGE_CONFIG.renewed.colors).toContain('bg-')
    expect(BADGE_CONFIG.success_case.label).toBeTruthy()
    expect(BADGE_CONFIG.success_case.colors).toContain('bg-')
  })
})

describe('alert/timing constants', () => {
  it('has reasonable values', () => {
    expect(CALLS_PER_MONTH).toBeGreaterThan(0)
    expect(PROGRAM_DURATION_DAYS).toBe(90)
    expect(RENEWAL_ALERT_DAYS).toBeGreaterThan(0)
    expect(TRAINING_PLAN_ALERT_DAYS).toBeGreaterThan(0)
    expect(CHECKIN_GRACE_DAYS).toBeGreaterThan(0)
    expect(PHASE_ALERT_DAYS_BEFORE).toBeGreaterThan(0)
  })
})
