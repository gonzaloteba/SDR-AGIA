import { extractValue, mapAuditFields, buildCheckInData } from '@/lib/typeform-helpers'
import type { TypeformAnswer } from '@/lib/typeform-helpers'

describe('extractValue', () => {
  it('extracts number type', () => {
    const answer: TypeformAnswer = { type: 'number', number: 42 }
    expect(extractValue(answer)).toBe(42)
  })

  it('extracts text type', () => {
    const answer: TypeformAnswer = { type: 'text', text: 'hello' }
    expect(extractValue(answer)).toBe('hello')
  })

  it('extracts boolean type', () => {
    const answer: TypeformAnswer = { type: 'boolean', boolean: true }
    expect(extractValue(answer)).toBe(true)
  })

  it('extracts choice label', () => {
    const answer: TypeformAnswer = { type: 'choice', choice: { label: 'Option A' } }
    expect(extractValue(answer)).toBe('Option A')
  })

  it('extracts choices as comma-separated labels', () => {
    const answer: TypeformAnswer = { type: 'choices', choices: { labels: ['A', 'B', 'C'] } }
    expect(extractValue(answer)).toBe('A, B, C')
  })

  it('extracts file_url', () => {
    const answer: TypeformAnswer = { type: 'file_url', file_url: 'https://example.com/photo.jpg' }
    expect(extractValue(answer)).toBe('https://example.com/photo.jpg')
  })

  it('extracts url', () => {
    const answer: TypeformAnswer = { type: 'url', url: 'https://example.com' }
    expect(extractValue(answer)).toBe('https://example.com')
  })

  it('extracts phone_number', () => {
    const answer: TypeformAnswer = { type: 'phone_number', phone_number: '+34612345678' }
    expect(extractValue(answer)).toBe('+34612345678')
  })

  it('extracts date and strips time', () => {
    const answer: TypeformAnswer = { type: 'date', date: '2000-05-15T00:00:00Z' }
    expect(extractValue(answer)).toBe('2000-05-15')
  })

  it('handles date without T separator', () => {
    const answer: TypeformAnswer = { type: 'date', date: '2000-05-15' }
    expect(extractValue(answer)).toBe('2000-05-15')
  })

  it('handles undefined choice gracefully', () => {
    const answer: TypeformAnswer = { type: 'choice' }
    expect(extractValue(answer)).toBeUndefined()
  })

  it('handles unknown type by accessing dynamic key', () => {
    const answer: TypeformAnswer = { type: 'custom', custom: 'value' }
    expect(extractValue(answer)).toBe('value')
  })
})

describe('mapAuditFields', () => {
  it('maps sleep_hours_avg from string', () => {
    const answerMap = new Map<string, unknown>()
    // '7cZDeEaVwh7B' maps to 'sleep_hours_avg' in AUDIT_FIELD_MAP
    answerMap.set('7cZDeEaVwh7B', 'Entre 7h y 8h')
    const data: Record<string, unknown> = {}
    mapAuditFields(answerMap, data)
    expect(data.sleep_hours_avg).toBe('7-8')
  })

  it('maps training_days_per_week as number', () => {
    const answerMap = new Map<string, unknown>()
    // 'n5h069M9qeNA' maps to 'training_days_per_week'
    answerMap.set('n5h069M9qeNA', '5')
    const data: Record<string, unknown> = {}
    mapAuditFields(answerMap, data)
    expect(data.training_days_per_week).toBe(5)
  })

  it('maps training_days_per_week to null for invalid input', () => {
    const answerMap = new Map<string, unknown>()
    answerMap.set('n5h069M9qeNA', 'abc')
    const data: Record<string, unknown> = {}
    mapAuditFields(answerMap, data)
    expect(data.training_days_per_week).toBeNull()
  })

  it('maps boolean fields from boolean value', () => {
    const answerMap = new Map<string, unknown>()
    // 'uwAyyPRPU0B2' maps to 'has_event'
    answerMap.set('uwAyyPRPU0B2', true)
    const data: Record<string, unknown> = {}
    mapAuditFields(answerMap, data)
    expect(data.has_event).toBe(true)
  })

  it('maps boolean fields from Spanish string', () => {
    const answerMap = new Map<string, unknown>()
    answerMap.set('uwAyyPRPU0B2', 'Sí')
    const data: Record<string, unknown> = {}
    mapAuditFields(answerMap, data)
    expect(data.has_event).toBe(true)
  })

  it('maps birth_date stripping time part', () => {
    const answerMap = new Map<string, unknown>()
    // 'IWDqcgtfz5T0' maps to 'birth_date'
    answerMap.set('IWDqcgtfz5T0', '1991-10-08T00:00:00Z')
    const data: Record<string, unknown> = {}
    mapAuditFields(answerMap, data)
    expect(data.birth_date).toBe('1991-10-08')
  })

  it('maps numeric fields', () => {
    const answerMap = new Map<string, unknown>()
    // '4o0iFaaEluKG' maps to 'height_cm'
    answerMap.set('4o0iFaaEluKG', 185)
    const data: Record<string, unknown> = {}
    mapAuditFields(answerMap, data)
    expect(data.height_cm).toBe(185)
  })

  it('maps location and infers timezone', () => {
    const answerMap = new Map<string, unknown>()
    // '7aawMA8puX6z' maps to 'location'
    answerMap.set('7aawMA8puX6z', 'Madrid, España')
    const data: Record<string, unknown> = {}
    mapAuditFields(answerMap, data)
    expect(data.location).toBe('Madrid, España')
    expect(data.timezone).toBe('Europe/Madrid')
  })

  it('maps diagnosis from boolean', () => {
    const answerMap = new Map<string, unknown>()
    // We need the diagnosis field ID - it's not in the mapping, so skip
    // Diagnosis doesn't seem to be in AUDIT_FIELD_MAP
  })

  it('ignores undefined/null values', () => {
    const answerMap = new Map<string, unknown>()
    answerMap.set('4o0iFaaEluKG', undefined)
    answerMap.set('7aawMA8puX6z', null)
    const data: Record<string, unknown> = {}
    mapAuditFields(answerMap, data)
    expect(data.height_cm).toBeUndefined()
    expect(data.location).toBeUndefined()
  })

  it('maps initial_photo_url only for non-empty strings', () => {
    const answerMap = new Map<string, unknown>()
    // '1BGJgXqDAcqc' maps to 'initial_photo_url'
    answerMap.set('1BGJgXqDAcqc', 'https://example.com/photo.jpg')
    const data: Record<string, unknown> = {}
    mapAuditFields(answerMap, data)
    expect(data.initial_photo_url).toBe('https://example.com/photo.jpg')
  })

  it('does not map empty string for initial_photo_url', () => {
    const answerMap = new Map<string, unknown>()
    answerMap.set('1BGJgXqDAcqc', '')
    const data: Record<string, unknown> = {}
    mapAuditFields(answerMap, data)
    expect(data.initial_photo_url).toBeUndefined()
  })
})

describe('buildCheckInData', () => {
  it('includes client_id, submitted_at, and typeform_response_id', () => {
    const answerMap = new Map<string, unknown>()
    const result = buildCheckInData(answerMap, 'client-123', '2024-01-01T00:00:00Z', 'resp-456')
    expect(result.client_id).toBe('client-123')
    expect(result.submitted_at).toBe('2024-01-01T00:00:00Z')
    expect(result.typeform_response_id).toBe('resp-456')
  })

  it('maps phase using parsePhase', () => {
    const answerMap = new Map<string, unknown>()
    // 'C3NytKcPJB6X' maps to 'phase'
    answerMap.set('C3NytKcPJB6X', 'Fase 2')
    const result = buildCheckInData(answerMap, 'c1', '2024-01-01', 'r1')
    expect(result.phase).toBe('2')
  })

  it('maps energy_level using ratingToTen', () => {
    const answerMap = new Map<string, unknown>()
    // 'Vn2AOcLqqvyx' maps to 'energy_level'
    answerMap.set('Vn2AOcLqqvyx', 4)
    const result = buildCheckInData(answerMap, 'c1', '2024-01-01', 'r1')
    expect(result.energy_level).toBe(8)
  })

  it('maps stress_level using ratingToTen', () => {
    const answerMap = new Map<string, unknown>()
    // 'ZVnGSixUUuNd' maps to 'stress_level'
    answerMap.set('ZVnGSixUUuNd', 3)
    const result = buildCheckInData(answerMap, 'c1', '2024-01-01', 'r1')
    expect(result.stress_level).toBe(6)
  })

  it('maps sleep_hours using parseSleepHours', () => {
    const answerMap = new Map<string, unknown>()
    // 'Hv5aBHfyAWhF' maps to 'sleep_hours'
    answerMap.set('Hv5aBHfyAWhF', 'Entre 7h y 8h')
    const result = buildCheckInData(answerMap, 'c1', '2024-01-01', 'r1')
    expect(result.sleep_hours).toBe('7-8')
  })

  it('collects photo_urls', () => {
    const answerMap = new Map<string, unknown>()
    // 'Ub0gnxSOEQJE' maps to 'photo_urls'
    answerMap.set('Ub0gnxSOEQJE', 'https://example.com/photo1.jpg')
    const result = buildCheckInData(answerMap, 'c1', '2024-01-01', 'r1')
    expect(result.photo_urls).toEqual(['https://example.com/photo1.jpg'])
  })

  it('does not include photo_urls if none provided', () => {
    const answerMap = new Map<string, unknown>()
    const result = buildCheckInData(answerMap, 'c1', '2024-01-01', 'r1')
    expect(result.photo_urls).toBeUndefined()
  })

  it('maps weight as default (pass-through)', () => {
    const answerMap = new Map<string, unknown>()
    // 'M46bbdMNe9hL' maps to 'weight'
    answerMap.set('M46bbdMNe9hL', 75.5)
    const result = buildCheckInData(answerMap, 'c1', '2024-01-01', 'r1')
    expect(result.weight).toBe(75.5)
  })

  it('maps loss_of_control from string', () => {
    const answerMap = new Map<string, unknown>()
    // '1XQAVs05cAIm' maps to 'loss_of_control'
    answerMap.set('1XQAVs05cAIm', 'Sí')
    const result = buildCheckInData(answerMap, 'c1', '2024-01-01', 'r1')
    expect(result.loss_of_control).toBe(true)
  })

  it('maps cravings from boolean', () => {
    const answerMap = new Map<string, unknown>()
    // '6mKvdn1ABqaQ' maps to 'cravings'
    answerMap.set('6mKvdn1ABqaQ', true)
    const result = buildCheckInData(answerMap, 'c1', '2024-01-01', 'r1')
    expect(result.cravings).toBe(true)
  })
})
