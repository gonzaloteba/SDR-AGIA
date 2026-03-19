import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getAdminClient } from '@/lib/supabase/admin'
import { getDefaultCoachId } from '@/lib/auth'
import type { AdminClient } from '@/lib/supabase/admin'
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
} from '@/lib/typeform-helpers'
import { persistPhoto, persistPhotos } from '@/lib/photo-storage'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Verify Typeform signature (HMAC SHA256) — mandatory
    const webhookSecret = process.env.TYPEFORM_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }
    const signature = request.headers.get('Typeform-Signature')
    if (!signature) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const expectedSig = 'sha256=' + createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('base64')
    if (signature !== expectedSig) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const formResponse = payload.form_response

    if (!formResponse) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const formId = formResponse.form_id
    const answers = formResponse.answers || []
    const responseId = formResponse.token
    const submittedAt = formResponse.submitted_at

    // Build answer map by field id
    const answerMap = new Map<string, unknown>()
    for (const answer of answers) {
      const id = answer.field?.id
      if (id) {
        answerMap.set(id, extractValue(answer))
      }
    }

    // Determine form type and name field refs
    let firstNameRef: string
    let lastNameRef: string
    let formType: string

    if (formId === CHECKIN_FORM_ID) {
      firstNameRef = CHECKIN_FIRST_NAME_REF
      lastNameRef = CHECKIN_LAST_NAME_REF
      formType = 'check-in'
    } else if (formId === AUDIT_FORM_ID) {
      firstNameRef = AUDIT_FIRST_NAME_REF
      lastNameRef = AUDIT_LAST_NAME_REF
      formType = 'audit'
    } else {
      // Legacy fallback for forms with hidden client_id
      const hiddenFields = formResponse.hidden || {}
      if (hiddenFields.client_id) {
        const supabase = getAdminClient()
        const checkInData = buildLegacyCheckIn(answerMap, hiddenFields.client_id, submittedAt, responseId)
        await supabase.from('check_ins').insert(checkInData)
        return NextResponse.json({ success: true, action: 'legacy_checkin' })
      }
      return NextResponse.json({
        success: false,
        warning: 'Unknown form',
        received_form_id: formId,
        expected_checkin: CHECKIN_FORM_ID,
        expected_audit: AUDIT_FORM_ID,
      })
    }

    // Resolve default coach for auto-created clients
    const defaultCoachId = await getDefaultCoachId()

    // Extract client name
    const firstName = answerMap.get(firstNameRef) as string | undefined
    const lastName = answerMap.get(lastNameRef) as string | undefined

    if (!firstName || !lastName) {
      return NextResponse.json({
        success: false,
        warning: 'Missing client name fields',
        debug: {
          form_type: formType,
          first_name_ref: firstNameRef,
          last_name_ref: lastNameRef,
          first_name_value: firstName || null,
          last_name_value: lastName || null,
          available_refs: Array.from(answerMap.keys()),
        },
      })
    }

    const supabase = getAdminClient()
    let client = await findClientByName(supabase, firstName, lastName)
    let action: string

    if (formId === AUDIT_FORM_ID) {
      // Check for duplicate audit response
      if (responseId) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('onboarding_response_id', responseId)
          .limit(1)
          .single()
        if (existing) {
          return NextResponse.json({
            success: true,
            action: 'duplicate_skipped',
            client_id: existing.id,
          })
        }
      }

      if (!client) {
        client = await createClientFromAudit(supabase, firstName, lastName, answerMap, submittedAt, defaultCoachId, responseId)
        action = 'client_created'
      } else {
        await handleAudit(supabase, client.id, answerMap, submittedAt, responseId)
        action = 'client_updated'
      }

      // Persist the initial photo (non-fatal: client is already created)
      try {
        const photoUrl = answerMap.get('1BGJgXqDAcqc') as string | undefined
        if (photoUrl && client) {
          const permanentUrl = await persistPhoto(supabase, photoUrl, client.id, 'initial')
          await supabase
            .from('clients')
            .update({ initial_photo_url: permanentUrl })
            .eq('id', client.id)
        }
      } catch {
        // Photo persistence is non-critical — client was already created
      }

      // Create an initial check-in from the audit data (non-fatal)
      try {
        await createInitialCheckIn(supabase, client.id, answerMap, submittedAt, responseId)
      } catch {
        // Initial check-in is non-critical — client was already created
      }

    } else if (formId === CHECKIN_FORM_ID) {
      // Check for duplicate check-in response
      if (responseId) {
        const { data: existingCheckIn } = await supabase
          .from('check_ins')
          .select('id')
          .eq('typeform_response_id', responseId)
          .limit(1)
          .single()
        if (existingCheckIn) {
          return NextResponse.json({
            success: true,
            action: 'duplicate_skipped',
            check_in_id: existingCheckIn.id,
          })
        }
      }

      if (!client) {
        // Auto-create client from check-in data
        const { data: newClient, error: createErr } = await supabase
          .from('clients')
          .insert({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            start_date: (submittedAt || new Date().toISOString()).split('T')[0],
            coach_id: defaultCoachId,
          })
          .select('id')
          .single()

        if (createErr || !newClient) {
          return NextResponse.json(
            {
              success: false,
              error: `Auto-create client failed: ${createErr?.message}`,
              debug: { form_type: formType, first_name: firstName, last_name: lastName },
            },
            { status: 500 }
          )
        }
        client = newClient
      }
      await handleCheckIn(supabase, client.id, answerMap, submittedAt, responseId)
      action = 'checkin_inserted'
    } else {
      action = 'no_action'
    }

    return NextResponse.json({
      success: true,
      action,
      client_name: `${firstName} ${lastName}`,
      client_id: client?.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', detail: (error as Error).message },
      { status: 500 }
    )
  }
}

// ============================================
// Date helpers
// ============================================

/** Calculate end date as start_date + N days (default 90 for 3-month program) */
function calculateEndDate(startDate: string, days: number = 90): string {
  const start = new Date(startDate + 'T12:00:00')
  start.setDate(start.getDate() + days)
  return start.toISOString().split('T')[0]
}

// ============================================
// Check-In Handler
// ============================================
async function handleCheckIn(
  supabase: AdminClient,
  clientId: string,
  answerMap: Map<string, unknown>,
  submittedAt: string,
  responseId: string
) {
  const checkInData = buildCheckInData(answerMap, clientId, submittedAt, responseId)

  // Persist check-in photos to Supabase Storage (non-fatal: keeps temp URLs on failure)
  try {
    if (checkInData.photo_urls && Array.isArray(checkInData.photo_urls) && checkInData.photo_urls.length > 0) {
      checkInData.photo_urls = await persistPhotos(supabase, checkInData.photo_urls, clientId, 'checkin')
    }
  } catch {
    // Photo persistence failed — check-in will keep original Typeform temp URLs
  }

  const { error: insertError } = await supabase
    .from('check_ins')
    .insert(checkInData)

  if (insertError) throw insertError

  // Resolve any existing missed_checkin alerts (non-fatal: check-in is already saved)
  try {
    await supabase
      .from('alerts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .eq('type', 'missed_checkin')
      .eq('is_resolved', false)
  } catch {
    // Alert resolution is non-critical — check-in data is already persisted
  }
}

// ============================================
// Auto-create client from Auditoría Inicial
// ============================================
async function createClientFromAudit(
  supabase: AdminClient,
  firstName: string,
  lastName: string,
  answerMap: Map<string, unknown>,
  submittedAt: string,
  coachId: string | null,
  responseId?: string
): Promise<{ id: string }> {
  const startDate = submittedAt.split('T')[0]
  const endDate = calculateEndDate(startDate, 90)

  const clientData: Record<string, unknown> = {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    start_date: startDate,
    end_date: endDate,
    renewal_date: endDate,
    plan_type: '3_months',
    onboarding_submitted_at: submittedAt,
    coach_id: coachId,
  }
  if (responseId) clientData.onboarding_response_id = responseId

  mapAuditFields(answerMap, clientData)

  const { data, error } = await supabase
    .from('clients')
    .insert(clientData)
    .select('id')
    .single()

  if (error) throw error

  return data
}

// ============================================
// Auditoría Inicial Handler
// ============================================
async function handleAudit(
  supabase: AdminClient,
  clientId: string,
  answerMap: Map<string, unknown>,
  submittedAt: string,
  responseId?: string
) {
  const updateData: Record<string, unknown> = {
    onboarding_submitted_at: submittedAt,
  }
  if (responseId) updateData.onboarding_response_id = responseId

  mapAuditFields(answerMap, updateData)

  // Backfill end_date/renewal_date if missing
  const { data: existing } = await supabase
    .from('clients')
    .select('start_date, end_date, renewal_date')
    .eq('id', clientId)
    .single()
  if (existing && !existing.end_date) {
    const sd = existing.start_date || submittedAt.split('T')[0]
    const ed = calculateEndDate(sd, 90)
    updateData.end_date = ed
    updateData.renewal_date = existing.renewal_date || ed
  }

  const { error: updateError } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', clientId)

  if (updateError) throw updateError
}

// ============================================
// Create initial check-in from Auditoría data
// ============================================
async function createInitialCheckIn(
  supabase: AdminClient,
  clientId: string,
  answerMap: Map<string, unknown>,
  submittedAt: string,
  responseId: string
) {
  // Map audit fields to check-in fields
  const photoUrl = answerMap.get('1BGJgXqDAcqc') as string | undefined // initial_photo_url
  const energyLevel = answerMap.get('PPTeB980IRSG') as number | undefined // energy_level_initial
  const sleepQuality = answerMap.get('RndHdZQ2ENMg') as number | undefined // sleep_quality_initial
  const sleepHoursAvg = answerMap.get('7cZDeEaVwh7B') as string | undefined // sleep_hours_avg

  // Persist photo to storage if present
  let photoUrls: string[] | null = null
  if (photoUrl) {
    const permanentUrl = await persistPhoto(supabase, photoUrl, clientId, 'audit')
    photoUrls = [permanentUrl]
  }

  const checkInData: Record<string, unknown> = {
    client_id: clientId,
    submitted_at: submittedAt,
    typeform_response_id: `audit-${responseId}`,
    notes: 'Check-in inicial (Auditoría Inicial)',
    photo_urls: photoUrls,
  }

  if (typeof energyLevel === 'number') checkInData.energy_level = energyLevel
  if (typeof sleepQuality === 'number') checkInData.sleep_quality = sleepQuality
  if (sleepHoursAvg) {
    const num = parseFloat(String(sleepHoursAvg))
    if (!isNaN(num)) checkInData.sleep_hours = num
  }

  const { error } = await supabase
    .from('check_ins')
    .insert(checkInData)

  if (error) throw error
}

// ============================================
// Legacy fallback for forms with hidden client_id
// ============================================
function buildLegacyCheckIn(
  answerMap: Map<string, unknown>,
  clientId: string,
  submittedAt: string,
  responseId: string
) {
  const photoUrls: string[] = []

  for (const photoRef of ['photos', 'progress_photo', 'foto_progreso']) {
    const photoVal = answerMap.get(photoRef)
    if (typeof photoVal === 'string' && photoVal) {
      photoUrls.push(photoVal)
    }
  }

  return {
    client_id: clientId,
    submitted_at: submittedAt,
    typeform_response_id: responseId,
    weight: (answerMap.get('weight') as number) || null,
    body_fat_percentage: (answerMap.get('body_fat') as number) || null,
    waist_measurement: (answerMap.get('waist') as number) || null,
    energy_level: (answerMap.get('energy') as number) || null,
    sleep_quality: (answerMap.get('sleep') as number) || null,
    mood: (answerMap.get('mood') as number) || null,
    nutrition_adherence: (answerMap.get('nutrition_adherence') as number) || null,
    training_adherence: (answerMap.get('training_adherence') as number) || null,
    notes: (answerMap.get('notes') as string) || null,
    photo_urls: photoUrls.length > 0 ? photoUrls : null,
  }
}
