import type { AdminClient } from '@/lib/supabase/admin'
import {
  CHECKIN_FIELD_MAP,
  AUDIT_FIELD_MAP,
  parsePhase,
  ratingToTen,
  parseSleepHours,
  parseYesNoChoice,
  inferTimezone,
} from '@/lib/typeform-mappings'

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
  [key: string]: unknown
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

/**
 * Find a client by first + last name with fuzzy matching:
 * 1. Exact match (case-insensitive)
 * 2. Accent-insensitive + partial name matching
 */
export async function findClientByName(
  supabase: AdminClient,
  firstName: string,
  lastName: string
): Promise<{ id: string } | null> {
  const fn = firstName.trim()
  const ln = lastName.trim()

  // 1. Try exact match (case-insensitive)
  const { data: exact } = await supabase
    .from('clients')
    .select('id')
    .ilike('first_name', fn)
    .ilike('last_name', ln)
    .limit(1)
    .single()
  if (exact) return exact

  // 2. Fetch all clients and do fuzzy matching
  const { data: allClients } = await supabase
    .from('clients')
    .select('id, first_name, last_name')

  if (!allClients || allClients.length === 0) return null

  const normFn = removeAccents(fn).toLowerCase()
  const normLn = removeAccents(ln).toLowerCase()
  const lnFirstWord = normLn.split(/\s+/)[0]

  for (const client of allClients) {
    const cFn = removeAccents(client.first_name || '').toLowerCase().trim()
    const cLn = removeAccents(client.last_name || '').toLowerCase().trim()

    // Match first name: exact, or first word matches
    const fnMatch =
      cFn === normFn ||
      normFn === cFn.split(/\s+/)[0] ||
      cFn === normFn.split(/\s+/)[0]

    if (!fnMatch) continue

    // Match last name: exact, starts with, or first word matches
    const lnMatch =
      cLn === normLn ||
      normLn.startsWith(cLn) ||
      cLn.startsWith(normLn) ||
      cLn.split(/\s+/)[0] === lnFirstWord ||
      cLn === lnFirstWord

    if (lnMatch) return { id: client.id }
  }

  return null
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
