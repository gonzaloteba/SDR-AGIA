import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getAdminClient } from '@/lib/supabase/admin'
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

    // Verify Typeform signature (HMAC SHA256)
    const webhookSecret = process.env.TYPEFORM_WEBHOOK_SECRET
    if (webhookSecret) {
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
      if (!client) {
        client = await createClientFromAudit(supabase, firstName, lastName, answerMap, submittedAt)
        action = 'client_created'
      } else {
        await handleAudit(supabase, client.id, answerMap, submittedAt)
        action = 'client_updated'
      }

      // Persist the initial photo to Supabase Storage (replace temp URL)
      const photoUrl = answerMap.get('1BGJgXqDAcqc') as string | undefined
      if (photoUrl && client) {
        const permanentUrl = await persistPhoto(supabase, photoUrl, client.id, 'initial')
        // Update the client record with the permanent URL
        await supabase
          .from('clients')
          .update({ initial_photo_url: permanentUrl })
          .eq('id', client.id)
      }

      // Create an initial check-in from the audit data
      await createInitialCheckIn(supabase, client.id, answerMap, submittedAt, responseId)

    } else if (formId === CHECKIN_FORM_ID) {
      if (!client) {
        // Auto-create client from check-in data
        const { data: newClient, error: createErr } = await supabase
          .from('clients')
          .insert({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            start_date: (submittedAt || new Date().toISOString()).split('T')[0],
            coach_id: process.env.DEFAULT_COACH_ID || null,
          })
          .select('id')
          .single()

        if (createErr || !newClient) {
          return NextResponse.json({
            success: false,
            error: `Auto-create client failed: ${createErr?.message}`,
            debug: { form_type: formType, first_name: firstName, last_name: lastName },
          })
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
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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

  // Persist check-in photos to Supabase Storage
  if (checkInData.photo_urls && Array.isArray(checkInData.photo_urls) && checkInData.photo_urls.length > 0) {
    checkInData.photo_urls = await persistPhotos(supabase, checkInData.photo_urls, clientId, 'checkin')
  }

  const { error: insertError } = await supabase
    .from('check_ins')
    .insert(checkInData)

  if (insertError) throw insertError

  // Resolve any existing missed_checkin alerts
  await supabase
    .from('alerts')
    .update({ is_resolved: true, resolved_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .eq('type', 'missed_checkin')
    .eq('is_resolved', false)
}

// ============================================
// Auto-create client from Auditoría Inicial
// ============================================
async function createClientFromAudit(
  supabase: AdminClient,
  firstName: string,
  lastName: string,
  answerMap: Map<string, unknown>,
  submittedAt: string
): Promise<{ id: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientData: Record<string, any> = {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    start_date: submittedAt.split('T')[0],
    onboarding_submitted_at: submittedAt,
    coach_id: process.env.DEFAULT_COACH_ID || null,
  }

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
  submittedAt: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    onboarding_submitted_at: submittedAt,
  }

  mapAuditFields(answerMap, updateData)

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
  const sleepQuality = answerMap.get('x02zDXgVRaQ4') as number | undefined // sleep_quality_initial
  const sleepHoursAvg = answerMap.get('OG5Q3AEuSwx5') as string | undefined // sleep_hours_avg

  // Persist photo to storage if present
  let photoUrls: string[] | null = null
  if (photoUrl) {
    const permanentUrl = await persistPhoto(supabase, photoUrl, clientId, 'audit')
    photoUrls = [permanentUrl]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkInData: Record<string, any> = {
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
