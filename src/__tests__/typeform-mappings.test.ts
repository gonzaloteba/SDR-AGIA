import {
  parsePhase,
  ratingToTen,
  parseSleepHours,
  parseYesNoChoice,
  inferTimezone,
  CHECKIN_FORM_ID,
  AUDIT_FORM_ID,
  CHECKIN_FIELD_MAP,
  AUDIT_FIELD_MAP,
} from '@/lib/typeform-mappings'

describe('parsePhase', () => {
  it('extracts phase number from "Fase 1"', () => {
    expect(parsePhase('Fase 1')).toBe('1')
  })

  it('extracts phase number from "Fase 2 - Reintroducción"', () => {
    expect(parsePhase('Fase 2 - Reintroducción')).toBe('2')
  })

  it('extracts phase number from "Fase 3"', () => {
    expect(parsePhase('Fase 3')).toBe('3')
  })

  it('returns original string if no digit found', () => {
    expect(parsePhase('Sin fase')).toBe('Sin fase')
  })

  it('handles plain digit strings', () => {
    expect(parsePhase('2')).toBe('2')
  })
})

describe('ratingToTen', () => {
  it('converts 1-5 scale to 1-10', () => {
    expect(ratingToTen(1)).toBe(2)
    expect(ratingToTen(3)).toBe(6)
    expect(ratingToTen(5)).toBe(10)
  })

  it('caps at 10', () => {
    expect(ratingToTen(6)).toBe(10)
    expect(ratingToTen(10)).toBe(10)
  })

  it('handles zero', () => {
    expect(ratingToTen(0)).toBe(0)
  })
})

describe('parseSleepHours', () => {
  it('maps known Spanish labels', () => {
    expect(parseSleepHours('Menos de 5h')).toBe('< 5')
    expect(parseSleepHours('Entre 5h y 6h')).toBe('5-6')
    expect(parseSleepHours('Entre 6h y 7h')).toBe('6-7')
    expect(parseSleepHours('Entre 7h y 8h')).toBe('7-8')
    expect(parseSleepHours('+8h')).toBe('> 8')
  })

  it('returns original value for unknown labels', () => {
    expect(parseSleepHours('Unknown')).toBe('Unknown')
    expect(parseSleepHours('8 hours')).toBe('8 hours')
  })
})

describe('parseYesNoChoice', () => {
  it('returns true for "Sí" and "Si"', () => {
    expect(parseYesNoChoice('Sí')).toBe(true)
    expect(parseYesNoChoice('Si')).toBe(true)
    expect(parseYesNoChoice('sí')).toBe(true)
    expect(parseYesNoChoice('si')).toBe(true)
    expect(parseYesNoChoice('SI')).toBe(true)
  })

  it('returns false for "No"', () => {
    expect(parseYesNoChoice('No')).toBe(false)
    expect(parseYesNoChoice('no')).toBe(false)
  })

  it('returns false for empty or other values', () => {
    expect(parseYesNoChoice('')).toBe(false)
    expect(parseYesNoChoice('maybe')).toBe(false)
  })
})

describe('inferTimezone', () => {
  it('maps Spanish-speaking countries', () => {
    expect(inferTimezone('Lima, Perú')).toBe('America/Lima')
    expect(inferTimezone('Bogotá, Colombia')).toBe('America/Bogota')
    expect(inferTimezone('Buenos Aires')).toBe('America/Argentina/Buenos_Aires')
    expect(inferTimezone('Santiago de Chile')).toBe('America/Santiago')
    expect(inferTimezone('Madrid, España')).toBe('Europe/Madrid')
    expect(inferTimezone('Ciudad de México')).toBe('America/Mexico_City')
  })

  it('is case-insensitive', () => {
    expect(inferTimezone('LIMA')).toBe('America/Lima')
    expect(inferTimezone('madrid')).toBe('Europe/Madrid')
  })

  it('handles accented characters', () => {
    expect(inferTimezone('Bogotá')).toBe('America/Bogota')
    expect(inferTimezone('México')).toBe('America/Mexico_City')
  })

  it('returns null for unknown locations', () => {
    expect(inferTimezone('Tokyo')).toBeNull()
    expect(inferTimezone('London')).toBeNull()
    expect(inferTimezone('')).toBeNull()
  })

  it('maps US cities', () => {
    expect(inferTimezone('Miami, FL')).toBe('America/New_York')
    expect(inferTimezone('Los Angeles, CA')).toBe('America/Los_Angeles')
  })
})

describe('form constants', () => {
  it('has valid form IDs', () => {
    expect(CHECKIN_FORM_ID).toBeTruthy()
    expect(AUDIT_FORM_ID).toBeTruthy()
    expect(CHECKIN_FORM_ID).not.toBe(AUDIT_FORM_ID)
  })

  it('has field mappings for check-in form', () => {
    expect(Object.keys(CHECKIN_FIELD_MAP).length).toBeGreaterThan(0)
    // Should include key columns
    expect(Object.values(CHECKIN_FIELD_MAP)).toContain('weight')
    expect(Object.values(CHECKIN_FIELD_MAP)).toContain('phase')
    expect(Object.values(CHECKIN_FIELD_MAP)).toContain('energy_level')
    expect(Object.values(CHECKIN_FIELD_MAP)).toContain('photo_urls')
  })

  it('has field mappings for audit form', () => {
    expect(Object.keys(AUDIT_FIELD_MAP).length).toBeGreaterThan(0)
    expect(Object.values(AUDIT_FIELD_MAP)).toContain('birth_date')
    expect(Object.values(AUDIT_FIELD_MAP)).toContain('height_cm')
    expect(Object.values(AUDIT_FIELD_MAP)).toContain('initial_weight_kg')
    expect(Object.values(AUDIT_FIELD_MAP)).toContain('location')
  })
})
