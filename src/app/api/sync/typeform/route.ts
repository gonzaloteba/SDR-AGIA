import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  CHECKIN_FORM_ID,
  AUDIT_FORM_ID,
  CHECKIN_FIRST_NAME_REF,
  CHECKIN_LAST_NAME_REF,
  CHECKIN_FIELD_MAP,
  AUDIT_FIRST_NAME_REF,
  AUDIT_LAST_NAME_REF,
  AUDIT_FIELD_MAP,
  parsePhase,
  ratingToTen,
  parseSleepHours,
  parseYesNoChoice,
} from '@/lib/typeform-mappings'

const TYPEFORM_API_BASE = 'https://api.typeform.com'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractValue(answer: any): unknown {
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
    default:
      return answer[answer.type]
  }
}

async function findClientByName(
  supabase: ReturnType<typeof getAdminClient>,
  firstName: string,
  lastName: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from('clients')
    .select('id')
    .ilike('first_name', firstName.trim())
    .ilike('last_name', lastName.trim())
    .limit(1)
    .single()
  return data
}

/** Fetch all responses from a Typeform form (handles pagination) */
async function fetchAllResponses(formId: string, token: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allItems: any[] = []
  let before: string | undefined

  while (true) {
    const params = new URLSearchParams({ page_size: '100' })
    if (before) params.set('before', before)

    const res = await fetch(
      `${TYPEFORM_API_BASE}/forms/${formId}/responses?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Typeform API ${res.status}: ${text}`)
    }

    const data = await res.json()
    const items = data.items || []
    allItems.push(...items)

    if (items.length < 100) break
    before = items[items.length - 1].token
  }

  return allItems
}

export async function POST(request: NextRequest) {
  try {
    // Auth: require CRON_SECRET or service role key
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '')

    if (secret !== process.env.CRON_SECRET && secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const typeformToken = process.env.TYPEFORM_API_TOKEN
    if (!typeformToken) {
      return NextResponse.json({ error: 'TYPEFORM_API_TOKEN not configured' }, { status: 500 })
    }

    const supabase = getAdminClient()
    const results = {
      audit: { fetched: 0, created: 0, updated: 0, skipped: 0, errors: [] as string[] },
      checkin: { fetched: 0, inserted: 0, skipped: 0, errors: [] as string[] },
    }

    // ========== SYNC AUDITORÍA INICIAL ==========
    const auditResponses = await fetchAllResponses(AUDIT_FORM_ID, typeformToken)
    results.audit.fetched = auditResponses.length

    for (const response of auditResponses) {
      try {
        const answers = response.answers || []
        const submittedAt = response.submitted_at || response.landed_at
        const answerMap = new Map<string, unknown>()
        for (const answer of answers) {
          const id = answer.field?.id
          if (id) answerMap.set(id, extractValue(answer))
        }

        const firstName = answerMap.get(AUDIT_FIRST_NAME_REF) as string | undefined
        const lastName = answerMap.get(AUDIT_LAST_NAME_REF) as string | undefined
        if (!firstName || !lastName) {
          results.audit.skipped++
          continue
        }

        const client = await findClientByName(supabase, firstName, lastName)

        if (!client) {
          // Auto-create
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const clientData: Record<string, any> = {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            start_date: (submittedAt || new Date().toISOString()).split('T')[0],
            onboarding_submitted_at: submittedAt,
          }
          mapAuditFields(answerMap, clientData)

          const { error } = await supabase.from('clients').insert(clientData)
          if (error) {
            results.audit.errors.push(`Create ${firstName} ${lastName}: ${error.message}`)
          } else {
            results.audit.created++
          }
        } else {
          // Update existing
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updateData: Record<string, any> = { onboarding_submitted_at: submittedAt }
          mapAuditFields(answerMap, updateData)

          const { error } = await supabase.from('clients').update(updateData).eq('id', client.id)
          if (error) {
            results.audit.errors.push(`Update ${firstName} ${lastName}: ${error.message}`)
          } else {
            results.audit.updated++
          }
        }
      } catch (e) {
        results.audit.errors.push(`Response ${response.token}: ${(e as Error).message}`)
      }
    }

    // ========== SYNC CHECK-INS ==========
    const checkinResponses = await fetchAllResponses(CHECKIN_FORM_ID, typeformToken)
    results.checkin.fetched = checkinResponses.length

    // Get existing response IDs to skip duplicates
    const { data: existingCheckins } = await supabase
      .from('check_ins')
      .select('typeform_response_id')
    const existingIds = new Set((existingCheckins || []).map(c => c.typeform_response_id))

    for (const response of checkinResponses) {
      try {
        const responseId = response.token
        if (existingIds.has(responseId)) {
          results.checkin.skipped++
          continue
        }

        const answers = response.answers || []
        const submittedAt = response.submitted_at || response.landed_at
        const answerMap = new Map<string, unknown>()
        for (const answer of answers) {
          const id = answer.field?.id
          if (id) answerMap.set(id, extractValue(answer))
        }

        const firstName = answerMap.get(CHECKIN_FIRST_NAME_REF) as string | undefined
        const lastName = answerMap.get(CHECKIN_LAST_NAME_REF) as string | undefined
        if (!firstName || !lastName) {
          results.checkin.skipped++
          continue
        }

        const client = await findClientByName(supabase, firstName, lastName)
        if (!client) {
          results.checkin.errors.push(`Client not found: ${firstName} ${lastName}`)
          continue
        }

        // Build check-in data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const checkInData: Record<string, any> = {
          client_id: client.id,
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
              checkInData[column] = typeof value === 'boolean' ? value : true
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

        const { error } = await supabase.from('check_ins').insert(checkInData)
        if (error) {
          results.checkin.errors.push(`Insert check-in ${firstName} ${lastName}: ${error.message}`)
        } else {
          results.checkin.inserted++
        }
      } catch (e) {
        results.checkin.errors.push(`Response ${response.token}: ${(e as Error).message}`)
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error', detail: (error as Error).message },
      { status: 500 }
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAuditFields(answerMap: Map<string, unknown>, data: Record<string, any>) {
  for (const [fieldId, column] of Object.entries(AUDIT_FIELD_MAP)) {
    const value = answerMap.get(fieldId)
    if (value === undefined || value === null) continue

    switch (column) {
      case 'sleep_hours_avg': {
        const num = parseFloat(String(value))
        data[column] = isNaN(num) ? null : num
        break
      }
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
        data[column] = typeof value === 'boolean' ? value : true
        break
      case 'sleep_quality_initial':
      case 'energy_level_initial':
        data[column] = typeof value === 'number' ? value : parseInt(String(value), 10)
        break
      case 'initial_photo_url':
        if (typeof value === 'string' && value) data[column] = value
        break
      default:
        data[column] = value
    }
  }
}
