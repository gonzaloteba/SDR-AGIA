import { calculateHealthScore, getDaysRemaining } from '@/lib/health-score'

describe('calculateHealthScore', () => {
  it('returns green when no unresolved alerts', () => {
    expect(calculateHealthScore(0)).toBe('green')
  })

  it('returns red when there are unresolved alerts', () => {
    expect(calculateHealthScore(1)).toBe('red')
    expect(calculateHealthScore(5)).toBe('red')
    expect(calculateHealthScore(100)).toBe('red')
  })

  it('handles negative values gracefully', () => {
    // Current behavior: negative = green (no alerts)
    expect(calculateHealthScore(-1)).toBe('green')
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
