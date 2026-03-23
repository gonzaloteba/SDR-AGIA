import { calculateHealthScore, getDaysRemaining } from '@/lib/health-score'

describe('calculateHealthScore', () => {
  it('returns green when no issues', () => {
    expect(calculateHealthScore({ unresolvedAlerts: 0, pendingCoachActions: 0, hasRecentCheckin: true })).toBe('green')
  })

  it('returns red when there are unresolved alerts', () => {
    expect(calculateHealthScore({ unresolvedAlerts: 1, pendingCoachActions: 0, hasRecentCheckin: true })).toBe('red')
    expect(calculateHealthScore({ unresolvedAlerts: 5, pendingCoachActions: 0, hasRecentCheckin: true })).toBe('red')
  })

  it('returns red when there are pending coach actions', () => {
    expect(calculateHealthScore({ unresolvedAlerts: 0, pendingCoachActions: 1, hasRecentCheckin: true })).toBe('red')
  })

  it('returns red when missing recent checkin', () => {
    expect(calculateHealthScore({ unresolvedAlerts: 0, pendingCoachActions: 0, hasRecentCheckin: false })).toBe('red')
  })

  it('returns red when multiple issues', () => {
    expect(calculateHealthScore({ unresolvedAlerts: 2, pendingCoachActions: 1, hasRecentCheckin: false })).toBe('red')
  })
})

describe('getDaysRemaining', () => {
  it('returns positive days for future dates', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const result = getDaysRemaining(futureDate.toISOString().split('T')[0])
    expect(result).toBeGreaterThanOrEqual(29)
    expect(result).toBeLessThanOrEqual(30)
  })

  it('returns 0 for past dates', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 10)
    const result = getDaysRemaining(pastDate.toISOString().split('T')[0])
    expect(result).toBe(0)
  })

  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getDaysRemaining(today)).toBe(0)
  })

  it('handles ISO date strings', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 10)
    const isoString = futureDate.toISOString()
    const result = getDaysRemaining(isoString)
    expect(result).toBeGreaterThanOrEqual(9)
    expect(result).toBeLessThanOrEqual(10)
  })
})
