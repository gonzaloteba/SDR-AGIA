import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
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

// Use service role key for webhook operations (bypasses RLS)
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

/** Find client by first_name + last_name (case-insensitive, trimmed) */
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

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text()

    // Verify Typeform signature (HMAC SHA256)
    const webhookSecret = process.env.TYPEFORM_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('Typeform-Signature')
      if (!signature) {
        console.error('Missing Typeform-Signature header')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const expectedSig = 'sha256=' + createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('base64')
      if (signature !== expectedSig) {
        console.error('Typeform signature mismatch', { received: signature, expected: expectedSig })
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

    console.log(`[webhook] Received form_id=${formId}, responseId=${responseId}`)

    // Build answer map by field ref
    const answerMap = new Map<string, unknown>()
    for (const answer of answers) {
      const ref = answer.field?.ref
      if (ref) {
        answerMap.set(ref, extractValue(answer))
      }
    }

    // Determine which form and extract identification refs
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
      // Also try hidden fields as fallback for unknown forms
      const hiddenFields = formResponse.hidden || {}
      if (hiddenFields.client_id) {
        // Legacy support: if a form has client_id hidden field, use it
        const supabase = getAdminClient()
        const checkInData = buildLegacyCheckIn(answerMap, hiddenFields.client_id, submittedAt, responseId)
        await supabase.from('check_ins').insert(checkInData)
        return NextResponse.json({ success: true, action: 'legacy_checkin' })
      }
      console.warn(`Unknown form_id: ${formId}`)
      return NextResponse.json({
        success: false,
        warning: 'Unknown form',
        received_form_id: formId,
        expected_checkin: CHECKIN_FORM_ID,
        expected_audit: AUDIT_FORM_ID,
      })
    }

    // Extract client name from answers
    const firstName = answerMap.get(firstNameRef) as string | undefined
    const lastName = answerMap.get(lastNameRef) as string | undefined

    if (!firstName || !lastName) {
      console.error('Missing first_name or last_name in form response', {
        formId,
        responseId,
        firstName,
        lastName,
        firstNameRef,
        lastNameRef,
        availableRefs: Array.from(answerMap.keys()),
      })
      // Return 200 to not lose the webhook - Typeform would retry on non-2xx
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

    // Find client by name
    let client = await findClientByName(supabase, firstName, lastName)
    let action: string

    // Route to the correct handler
    if (formId === AUDIT_FORM_ID) {
      if (!client) {
        // Auto-create client from Auditoría Inicial data
        client = await createClientFromAudit(supabase, firstName, lastName, answerMap, submittedAt)
        action = 'client_created'
        console.log(`[webhook] Auto-created client "${firstName} ${lastName}" with id ${client.id}`)
      } else {
        // Update existing client with audit data
        await handleAudit(supabase, client.id, answerMap, submittedAt)
        action = 'client_updated'
        console.log(`[webhook] Updated audit for "${firstName} ${lastName}" (${client.id})`)
      }
    } else if (formId === CHECKIN_FORM_ID) {
      if (!client) {
        console.warn(`No client found for check-in: "${firstName} ${lastName}"`)
        return NextResponse.json({
          success: false,
          warning: `Client not found: ${firstName} ${lastName}`,
          debug: { form_type: formType, first_name: firstName, last_name: lastName },
        })
      }
      await handleCheckIn(supabase, client.id, answerMap, submittedAt, responseId)
      action = 'checkin_inserted'
      console.log(`[webhook] Check-in inserted for "${firstName} ${lastName}" (${client.id})`)
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
  supabase: ReturnType<typeof getAdminClient>,
  clientId: string,
  answerMap: Map<string, unknown>,
  submittedAt: string,
  responseId: string
) {
  const photoUrls: string[] = []

  // Build check-in data from field mappings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkInData: Record<string, any> = {
    client_id: clientId,
    submitted_at: submittedAt,
    typeform_response_id: responseId,
  }

  for (const [ref, column] of Object.entries(CHECKIN_FIELD_MAP)) {
    const value = answerMap.get(ref)
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
        checkInData[column] = typeof value === 'string'
          ? parseYesNoChoice(value)
          : value
        break
      case 'photo_urls':
        if (typeof value === 'string' && value) {
          photoUrls.push(value)
        }
        break
      default:
        checkInData[column] = value
    }
  }

  if (photoUrls.length > 0) {
    checkInData.photo_urls = photoUrls
  }

  // Insert check-in
  const { error: insertError } = await supabase
    .from('check_ins')
    .insert(checkInData)

  if (insertError) {
    console.error('Error inserting check-in:', insertError)
    throw insertError
  }

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
  supabase: ReturnType<typeof getAdminClient>,
  firstName: string,
  lastName: string,
  answerMap: Map<string, unknown>,
  submittedAt: string
): Promise<{ id: string }> {
  // Build client data with required fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientData: Record<string, any> = {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    start_date: submittedAt.split('T')[0], // Use submission date as start_date
    onboarding_submitted_at: submittedAt,
  }

  // Map audit form fields to client columns
  for (const [ref, column] of Object.entries(AUDIT_FIELD_MAP)) {
    const value = answerMap.get(ref)
    if (value === undefined || value === null) continue

    switch (column) {
      case 'sleep_hours_avg': {
        const num = parseFloat(String(value))
        clientData[column] = isNaN(num) ? null : num
        break
      }
      case 'training_days_per_week': {
        const num = parseInt(String(value), 10)
        clientData[column] = isNaN(num) ? null : num
        break
      }
      case 'has_event':
      case 'wakes_at_night':
      case 'feels_rested':
      case 'night_hunger':
      case 'trains_fasted':
        clientData[column] = typeof value === 'boolean' ? value : true
        break
      case 'sleep_quality_initial':
      case 'energy_level_initial':
        clientData[column] = typeof value === 'number' ? value : parseInt(String(value), 10)
        break
      case 'initial_photo_url':
        if (typeof value === 'string' && value) {
          clientData[column] = value
        }
        break
      default:
        clientData[column] = value
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(clientData)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating client from audit:', error)
    throw error
  }

  return data
}

// ============================================
// Auditoría Inicial Handler
// ============================================
async function handleAudit(
  supabase: ReturnType<typeof getAdminClient>,
  clientId: string,
  answerMap: Map<string, unknown>,
  submittedAt: string
) {
  // Build update data from field mappings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    onboarding_submitted_at: submittedAt,
  }

  for (const [ref, column] of Object.entries(AUDIT_FIELD_MAP)) {
    const value = answerMap.get(ref)
    if (value === undefined || value === null) continue

    switch (column) {
      case 'sleep_hours_avg': {
        // Try to parse numeric value from text like "7" or "7 horas"
        const num = parseFloat(String(value))
        updateData[column] = isNaN(num) ? null : num
        break
      }
      case 'training_days_per_week': {
        const num = parseInt(String(value), 10)
        updateData[column] = isNaN(num) ? null : num
        break
      }
      case 'has_event':
      case 'wakes_at_night':
      case 'feels_rested':
      case 'night_hunger':
      case 'trains_fasted':
        updateData[column] = typeof value === 'boolean' ? value : true
        break
      case 'sleep_quality_initial':
      case 'energy_level_initial':
        updateData[column] = typeof value === 'number' ? value : parseInt(String(value), 10)
        break
      case 'initial_photo_url':
        if (typeof value === 'string' && value) {
          updateData[column] = value
        }
        break
      default:
        updateData[column] = value
    }
  }

  const { error: updateError } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', clientId)

  if (updateError) {
    console.error('Error updating client from audit:', updateError)
    throw updateError
  }
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
