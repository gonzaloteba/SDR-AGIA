import { safeParseDate } from '@/lib/health-score'

describe('safeParseDate', () => {
  it('parses valid ISO date string', () => {
    const result = safeParseDate('2024-06-15')
    expect(result).toBeInstanceOf(Date)
    expect(result!.getFullYear()).toBe(2024)
  })

  it('parses full ISO datetime string', () => {
    const result = safeParseDate('2024-06-15T10:30:00Z')
    expect(result).toBeInstanceOf(Date)
  })

  it('returns null for null input', () => {
    expect(safeParseDate(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(safeParseDate(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(safeParseDate('')).toBeNull()
  })

  it('returns null for invalid date string', () => {
    expect(safeParseDate('not-a-date')).toBeNull()
  })

  it('returns null for "Invalid Date"', () => {
    expect(safeParseDate('Invalid Date')).toBeNull()
  })
})
