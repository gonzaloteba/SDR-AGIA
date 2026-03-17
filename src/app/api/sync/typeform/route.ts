import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import {
  CHECKIN_FORM_ID,
  AUDIT_FORM_ID,
  CHECKIN_FIRST_NAME_REF,
  CHECKIN_LAST_NAME_REF,
  AUDIT_FIRST_NAME_REF,
  AUDIT_LAST_NAME_REF,
} from '@/lib/typeform-mappings'
import {
  extractValue,
  findClientByName,
  mapAuditFields,
  buildCheckInData,
  type TypeformAnswer,
} from '@/lib/typeform-helpers'
import { persistPhoto, persistPhotos } from '@/lib/photo-storage'

const TYPEFORM_API_BASE = 'https://api.typeform.com'

/** Calculate end date as start_date + N days (default 90 for 3-month program) */
function calculateEndDate(startDate: string, days: number = 90): string {
  const start = new Date(startDate + 'T12:00:00')
  start.setDate(start.getDate() + days)
  return start.toISOString().split('T')[0]
}

/** Typeform response shape (external untyped API) */
interface TypeformResponse {
  token: string
  submitted_at?: string
  landed_at?: string
  answers?: TypeformAnswer[]
  [key: string]: unknown
}

/** Fetch all responses from a Typeform form (handles pagination) */
async function fetchAllResponses(formId: string, token: string) {
  const allItems: TypeformResponse[] = []
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
      checkin: { fetched: 0, inserted: 0, skipped: 0, clients_created: 0, auto_created_clients: [] as string[], errors: [] as string[] },
    }

    // ========== SYNC AUDITORÍA INICIAL ==========
    const auditResponses = await fetchAllResponses(AUDIT_FORM_ID, typeformToken)
    results.audit.fetched = auditResponses.length

    for (const response of auditResponses) {
      try {
        const answers = response.answers || []
        const submittedAt = response.submitted_at || response.landed_at || new Date().toISOString()
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
          const startDate = (submittedAt || new Date().toISOString()).split('T')[0]
          const endDate = calculateEndDate(startDate, 90)
          const clientData: Record<string, unknown> = {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            start_date: startDate,
            end_date: endDate,
            renewal_date: endDate,
            plan_type: '3_months',
            onboarding_submitted_at: submittedAt,
            onboarding_response_id: response.token,
            coach_id: process.env.DEFAULT_COACH_ID || null,
          }
          mapAuditFields(answerMap, clientData)

          const { data: newClient, error } = await supabase.from('clients').insert(clientData).select('id').single()
          if (error || !newClient) {
            results.audit.errors.push(`Create ${firstName} ${lastName}: ${error?.message}`)
          } else {
            results.audit.created++
            // Persist initial photo
            try {
              const photoUrl = answerMap.get('1BGJgXqDAcqc') as string | undefined
              if (photoUrl) {
                const permanentUrl = await persistPhoto(supabase, photoUrl, newClient.id, 'initial')
                await supabase.from('clients').update({ initial_photo_url: permanentUrl }).eq('id', newClient.id)
              }
            } catch { /* non-critical */ }
          }
        } else {
          const updateData: Record<string, unknown> = { onboarding_submitted_at: submittedAt, onboarding_response_id: response.token }
          mapAuditFields(answerMap, updateData)

          // Backfill end_date/renewal_date if missing
          const { data: existing } = await supabase
            .from('clients')
            .select('start_date, end_date, renewal_date')
            .eq('id', client.id)
            .single()
          if (existing && !existing.end_date) {
            const sd = existing.start_date || (submittedAt || new Date().toISOString()).split('T')[0]
            const ed = calculateEndDate(sd, 90)
            updateData.end_date = ed
            updateData.renewal_date = existing.renewal_date || ed
            if (!updateData.plan_type) updateData.plan_type = '3_months'
          }

          // Persist initial photo
          try {
            const photoUrl = answerMap.get('1BGJgXqDAcqc') as string | undefined
            if (photoUrl) {
              const permanentUrl = await persistPhoto(supabase, photoUrl, client.id, 'initial')
              updateData.initial_photo_url = permanentUrl
            }
          } catch { /* non-critical */ }

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
        const submittedAt = response.submitted_at || response.landed_at || new Date().toISOString()
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

        let client = await findClientByName(supabase, firstName, lastName)
        if (!client) {
          const checkinStartDate = (submittedAt || new Date().toISOString()).split('T')[0]
          const checkinEndDate = calculateEndDate(checkinStartDate, 90)
          const { data: newClient, error: createErr } = await supabase
            .from('clients')
            .insert({
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              start_date: checkinStartDate,
              end_date: checkinEndDate,
              renewal_date: checkinEndDate,
              plan_type: '3_months',
            })
            .select('id')
            .single()

          if (createErr || !newClient) {
            results.checkin.errors.push(`Auto-create failed for ${firstName} ${lastName}: ${createErr?.message}`)
            continue
          }
          client = newClient
          results.checkin.clients_created++
          results.checkin.auto_created_clients.push(`${firstName} ${lastName}`)
        }

        const checkInData = buildCheckInData(answerMap, client.id, submittedAt, responseId)

        // Persist check-in photos
        try {
          if (checkInData.photo_urls && Array.isArray(checkInData.photo_urls) && checkInData.photo_urls.length > 0) {
            checkInData.photo_urls = await persistPhotos(supabase, checkInData.photo_urls, client.id, 'checkin')
          }
        } catch { /* non-critical */ }

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
    return NextResponse.json(
      { error: 'Internal server error', detail: (error as Error).message },
      { status: 500 }
    )
  }
}
