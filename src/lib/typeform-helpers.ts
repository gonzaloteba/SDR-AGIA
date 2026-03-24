import type { AdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  CHECKIN_FIELD_MAP,
  AUDIT_FIELD_MAP,
  parsePhase,
  ratingToTen,
  parseSleepHours,
  parseYesNoChoice,
  inferTimezone,
} from '@/lib/typeform-mappings'

const log = logger('typeform:helpers')

/** Dynamic key-value record for building Supabase row data */
type RowData = Record<string, unknown>

/** Typeform answer payload (external data) */
export interface TypeformAnswer {
  type: string
  field?: { id: string }
  number?: number
  text?: string
  boolean?: boolean
  choice?: { label: string }
  choices?: { labels: string[] }
  file_url?: string
  url?: string
  phone_number?: string
  date?: string
  calendly?: {
    scheduled_at?: string
    event_uri?: string
    invitee_uri?: string
  }
  [key: string]: unknown
}

/** Calendly scheduling data extracted from Typeform */
export interface CalendlyData {
  scheduled_at: string
  event_uri: string | null
  invitee_uri: string | null
}

// ============================================
// Typeform answer extraction
// ============================================

/** Extract a typed value from a Typeform answer object */
export function extractValue(answer: TypeformAnswer): unknown {
  switch (answer.type) {
    case 'number':
      return answer.number
    case 'text':
      return answer.text
    case 'boolean':
      return answer.boolean
    case 'choice':
      return answer.choice?.label
    case 'choices':
      return answer.choices?.labels?.join(', ')
    case 'file_url':
      return answer.file_url
    case 'url':
      return answer.url
    case 'phone_number':
      return answer.phone_number
    case 'date':
      return answer.date ? answer.date.split('T')[0] : answer.date
    case 'calendly':
      return answer.calendly
    default:
      return answer[answer.type]
  }
}

// ============================================
// Client name matching
// ============================================

/** Remove accents/diacritics for comparison */
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Client row shape used for fuzzy matching */
type ClientNameRow = { id: string; first_name: string; last_name: string }

/**
 * Fuzzy match a client from a pre-loaded list (no DB query).
 * Use this in loops to avoid N+1 queries.
 */
export function findClientInList(
  clients: ClientNameRow[],
  firstName: string,
  lastName: string
): { id: string } | null {
  const fn = firstName.trim()
  const ln = lastName.trim()
  const normFn = removeAccents(fn).toLowerCase()
  const normLn = removeAccents(ln).toLowerCase()
  const lnFirstWord = normLn.split(/\s+/)[0]

  // 1. Exact match (case-insensitive)
  const exact = clients.find(
    (c) =>
      (c.first_name || '').toLowerCase().trim() === fn.toLowerCase() &&
      (c.last_name || '').toLowerCase().trim() === ln.toLowerCase()
  )
  if (exact) {
    log.info('Client matched by exact name', { clientId: exact.id, firstName: fn, lastName: ln })
    return { id: exact.id }
  }

  // 2. Fuzzy match (handles different first/last name splits)
  const searchFull = `${normFn} ${normLn}`.trim()

  for (const client of clients) {
    const cFn = removeAccents(client.first_name || '').toLowerCase().trim()
    const cLn = removeAccents(client.last_name || '').toLowerCase().trim()
    const cFull = `${cFn} ${cLn}`.trim()

    // 2a. Traditional first/last matching
    const fnMatch =
      cFn === normFn ||
      normFn === cFn.split(/\s+/)[0] ||
      cFn === normFn.split(/\s+/)[0]

    if (fnMatch) {
      const lnMatch =
        cLn === normLn ||
        normLn.startsWith(cLn) ||
        cLn.startsWith(normLn) ||
        cLn.split(/\s+/)[0] === lnFirstWord ||
        cLn === lnFirstWord

      if (lnMatch) {
        log.info('Client matched by fuzzy name', {
          clientId: client.id,
          searchedName: `${fn} ${ln}`,
          matchedName: `${client.first_name} ${client.last_name}`,
          matchType: 'fuzzy',
        })
        return { id: client.id }
      }
    }

    // 2b. Full-name matching (handles different first/last splits)
    // e.g. search "Hermes" + "Octavio Contla" vs DB "Hermes Octavio" + "Contla Gutiérrez"
    if (searchFull.length >= 3 && cFull.length >= 3) {
      if (cFull.startsWith(searchFull) || searchFull.startsWith(cFull)) {
        log.info('Client matched by full-name prefix', {
          clientId: client.id,
          searchedName: `${fn} ${ln}`,
          matchedName: `${client.first_name} ${client.last_name}`,
          matchType: 'full-name-prefix',
        })
        return { id: client.id }
      }
    }
  }

  return null
}

/**
 * Find a client by first + last name with fuzzy matching:
 * 1. Exact match (case-insensitive) via DB
 * 2. Accent-insensitive + partial name matching in memory
 */
export async function findClientByName(
  supabase: AdminClient,
  firstName: string,
  lastName: string
): Promise<{ id: string } | null> {
  const fn = firstName.trim()
  const ln = lastName.trim()

  // 1. Try exact match (case-insensitive)
  const { data: exact, error: exactError } = await supabase
    .from('clients')
    .select('id')
    .ilike('first_name', fn)
    .ilike('last_name', ln)
    .limit(1)
    .single()

  if (exactError && exactError.code !== 'PGRST116') {
    log.error('Exact name match query failed', { error: exactError.message, firstName: fn, lastName: ln })
  }

  if (exact) {
    log.info('Client matched by exact name', { clientId: exact.id, firstName: fn, lastName: ln })
    return exact
  }

  // 2. Fetch all clients and do fuzzy matching
  const { data: allClients, error: fetchError } = await supabase
    .from('clients')
    .select('id, first_name, last_name')

  if (fetchError) {
    log.error('Failed to fetch clients for fuzzy match', { error: fetchError.message })
    return null
  }

  if (!allClients || allClients.length === 0) return null

  const result = findClientInList(allClients, fn, ln)
  if (!result) {
    log.warn('No client found for name', { firstName: fn, lastName: ln, totalClientsSearched: allClients.length })
  }
  return result
}

// ============================================
// Audit field mapping
// ============================================

/** Map audit form answers to client table columns */
export function mapAuditFields(answerMap: Map<string, unknown>, data: RowData) {
  for (const [fieldId, column] of Object.entries(AUDIT_FIELD_MAP)) {
    const value = answerMap.get(fieldId)
    if (value === undefined || value === null) continue

    switch (column) {
      case 'sleep_hours_avg':
        data[column] = typeof value === 'string' ? parseSleepHours(value) : String(value)
        break
      case 'training_days_per_week': {
        const num = parseInt(String(value), 10)
        data[column] = isNaN(num) ? null : num
        break
      }
      case 'has_event':
      case 'wakes_at_night':
      case 'feels_rested':
      case 'night_hunger':
      case 'trains_fasted':
        data[column] = typeof value === 'boolean' ? value : parseYesNoChoice(String(value))
        break
      case 'sleep_quality_initial':
      case 'energy_level_initial':
        data[column] = typeof value === 'number' ? value : parseInt(String(value), 10)
        break
      case 'initial_photo_url':
        if (typeof value === 'string' && value) data[column] = value
        break
      case 'birth_date':
        // Typeform date fields come as ISO strings; store as YYYY-MM-DD
        if (typeof value === 'string' && value) {
          data[column] = value.split('T')[0]
        }
        break
      case 'height_cm':
      case 'initial_weight_kg':
      case 'initial_body_fat_pct':
      case 'stress_level_initial': {
        const numVal = typeof value === 'number' ? value : parseFloat(String(value))
        if (!isNaN(numVal)) data[column] = numVal
        break
      }
      case 'diagnosis':
        // May come as boolean ("Sí"/"No") or text
        if (typeof value === 'boolean') {
          data[column] = value ? 'TRUE' : 'FALSE'
        } else if (typeof value === 'string') {
          const lower = value.toLowerCase()
          if (lower === 'sí' || lower === 'si') data[column] = 'TRUE'
          else if (lower === 'no') data[column] = 'FALSE'
          else data[column] = value
        }
        break
      case 'location':
        data[column] = value
        // Infer timezone from location text
        if (typeof value === 'string') {
          const tz = inferTimezone(value)
          if (tz) data.timezone = tz
        }
        break
      default:
        data[column] = value
    }
  }
}

// ============================================
// Check-in data building
// ============================================

/**
 * Extract Calendly scheduling data from Typeform answers.
 * Scans all answers for a calendly-type field (there should be at most one).
 */
export function extractCalendlyData(answers: TypeformAnswer[]): CalendlyData | null {
  for (const answer of answers) {
    if (answer.type === 'calendly' && answer.calendly?.scheduled_at) {
      log.info('Calendly scheduling data found', {
        scheduled_at: answer.calendly.scheduled_at,
        event_uri: answer.calendly.event_uri || null,
      })
      return {
        scheduled_at: answer.calendly.scheduled_at,
        event_uri: answer.calendly.event_uri || null,
        invitee_uri: answer.calendly.invitee_uri || null,
      }
    }
  }
  return null
}

/** Build check-in row data from Typeform answers */
export function buildCheckInData(
  answerMap: Map<string, unknown>,
  clientId: string,
  submittedAt: string,
  responseId: string
): RowData {
  const checkInData: RowData = {
    client_id: clientId,
    submitted_at: submittedAt,
    typeform_response_id: responseId,
  }
  const photoUrls: string[] = []

  for (const [fieldId, column] of Object.entries(CHECKIN_FIELD_MAP)) {
    const value = answerMap.get(fieldId)
    if (value === undefined || value === null) continue

    switch (column) {
      case 'phase':
        checkInData[column] = parsePhase(value as string)
        break
      case 'energy_level':
      case 'stress_level':
        checkInData[column] = ratingToTen(value as number)
        break
      case 'sleep_hours':
        checkInData[column] = parseSleepHours(value as string)
        break
      case 'cravings':
        checkInData[column] = typeof value === 'boolean' ? value : parseYesNoChoice(String(value))
        break
      case 'loss_of_control':
        checkInData[column] = typeof value === 'string' ? parseYesNoChoice(value) : value
        break
      case 'photo_urls':
        if (typeof value === 'string' && value) photoUrls.push(value)
        break
      default:
        checkInData[column] = value
    }
  }

  if (photoUrls.length > 0) checkInData.photo_urls = photoUrls

  return checkInData
}
