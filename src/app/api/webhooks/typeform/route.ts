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
  extractCalendlyData,
  findClientByName,
  mapAuditFields,
  buildCheckInData,
} from '@/lib/typeform-helpers'
import type { TypeformAnswer } from '@/lib/typeform-helpers'
import { persistPhoto, persistPhotos } from '@/lib/photo-storage'
import { getCurrentUser, getScheduledEvents, getEventInvitees, extractMeetLink } from '@/lib/calendly'
import { logger } from '@/lib/logger'

const log = logger('webhook:typeform')

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

    log.info('Webhook received', {
      formId,
      responseId,
      answerCount: answers.length,
      answerTypes: answers.map((a: TypeformAnswer) => `${a.field?.id}:${a.type}`),
    })

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
    let calendlyAction: string | null = null

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
      } catch (e) {
        log.warn('Photo persistence failed (non-critical)', { clientId: client?.id, error: (e as Error).message })
      }

      // Create an initial check-in from the audit data (non-fatal)
      try {
        await createInitialCheckIn(supabase, client.id, answerMap, submittedAt, responseId)
      } catch (e) {
        log.warn('Initial check-in creation failed (non-critical)', { clientId: client?.id, error: (e as Error).message })
      }

      // Process Calendly scheduling data from audit form (non-fatal)
      try {
        const calendlyData = extractCalendlyData(answers as TypeformAnswer[])
        if (calendlyData && client) {
          log.info('Calendly data found in audit form, creating scheduled call', {
            clientId: client.id,
            clientName: `${firstName} ${lastName}`,
            scheduled_at: calendlyData.scheduled_at,
            event_uri: calendlyData.event_uri || 'none',
          })
          await createScheduledCall(supabase, client.id, calendlyData, firstName, lastName, defaultCoachId, 'audit')
          calendlyAction = 'call_scheduled'
        } else if (client) {
          // No Calendly embed data — try to find upcoming events via Calendly API
          log.info('No Calendly embed data in audit, checking Calendly API for upcoming events', {
            clientName: `${firstName} ${lastName}`,
          })
          calendlyAction = await syncCalendlyForClient(supabase, client.id, firstName, lastName, defaultCoachId)
        }
      } catch (calendlyError) {
        const errMsg = (calendlyError as Error).message
        log.error('Failed to process Calendly scheduling data from audit', {
          clientId: client?.id || 'unknown',
          clientName: `${firstName} ${lastName}`,
          error: errMsg,
        })
        calendlyAction = `error: ${errMsg}`
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

      // Process Calendly scheduling data (non-fatal)
      try {
        const calendlyData = extractCalendlyData(answers as TypeformAnswer[])
        if (calendlyData && client) {
          log.info('Calendly data found, creating scheduled call', {
            clientId: client.id,
            clientName: `${firstName} ${lastName}`,
            scheduled_at: calendlyData.scheduled_at,
            event_uri: calendlyData.event_uri || 'none',
          })
          await createScheduledCall(supabase, client.id, calendlyData, firstName, lastName, defaultCoachId)
          calendlyAction = 'call_scheduled'
        } else if (client) {
          // No Calendly embed data — try to find upcoming events via Calendly API
          log.info('No Calendly embed data, checking Calendly API for upcoming events', {
            clientName: `${firstName} ${lastName}`,
          })
          calendlyAction = await syncCalendlyForClient(supabase, client.id, firstName, lastName, defaultCoachId)
        }
      } catch (calendlyError) {
        const errMsg = (calendlyError as Error).message
        log.error('Failed to process Calendly scheduling data', {
          clientId: client?.id || 'unknown',
          clientName: `${firstName} ${lastName}`,
          error: errMsg,
        })
        calendlyAction = `error: ${errMsg}`
      }
    } else {
      action = 'no_action'
    }

    return NextResponse.json({
      success: true,
      action,
      client_name: `${firstName} ${lastName}`,
      client_id: client?.id,
      ...(calendlyAction ? { calendly: calendlyAction } : {}),
    })
  } catch (error) {
    log.error('Typeform webhook failed', { error: (error as Error).message })
    return NextResponse.json(
      { error: 'Internal server error' },
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
  } catch (e) {
    log.warn('Check-in photo persistence failed', { clientId, error: (e as Error).message })
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
  } catch (e) {
    log.warn('Alert resolution failed (non-critical)', { clientId, error: (e as Error).message })
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
// Create scheduled call from Calendly data
// ============================================
async function createScheduledCall(
  supabase: AdminClient,
  clientId: string,
  calendlyData: { scheduled_at: string; event_uri: string | null; invitee_uri: string | null },
  firstName: string,
  lastName: string,
  coachId: string | null,
  source: 'check-in' | 'audit' = 'check-in'
) {
  const scheduledDate = new Date(calendlyData.scheduled_at)
  const callDate = scheduledDate.toISOString().split('T')[0]

  // Check for duplicate scheduled call (same client + same scheduled_at)
  const { data: existing } = await supabase
    .from('calls')
    .select('id')
    .eq('client_id', clientId)
    .eq('scheduled_at', calendlyData.scheduled_at)
    .limit(1)
    .single()

  if (existing) {
    log.info('Duplicate scheduled call skipped', { clientId, scheduled_at: calendlyData.scheduled_at, existingCallId: existing.id })
    return
  }

  // Insert call with scheduled_at (no transcript yet — it's a future call)
  const { error: callError } = await supabase
    .from('calls')
    .insert({
      client_id: clientId,
      coach_id: coachId,
      call_date: callDate,
      scheduled_at: calendlyData.scheduled_at,
      calendly_event_uri: calendlyData.event_uri,
      duration_minutes: 15,
      notes: `Llamada agendada desde Calendly (${source})`,
    })

  if (callError) {
    log.error('Failed to insert scheduled call', { clientId, error: callError.message, code: callError.code })
    throw callError
  }

  log.info('Scheduled call created successfully', { clientId, callDate, scheduled_at: calendlyData.scheduled_at })

  // Create upcoming_call alert
  const formattedDate = scheduledDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  await supabase
    .from('alerts')
    .insert({
      client_id: clientId,
      type: 'upcoming_call',
      severity: 'high',
      message: `Llamada programada con ${firstName} ${lastName} — ${formattedDate}`,
    })
}

// ============================================
// Sync Calendly events for a specific client
// ============================================
async function syncCalendlyForClient(
  supabase: AdminClient,
  clientId: string,
  firstName: string,
  lastName: string,
  coachId: string | null
): Promise<string> {
  try {
    const user = await getCurrentUser()
    const now = new Date()
    const maxDate = new Date(now)
    maxDate.setDate(maxDate.getDate() + 30)

    // Also check 24h in the past to catch recently-booked events
    const minDate = new Date(now)
    minDate.setHours(minDate.getHours() - 24)

    const events = await getScheduledEvents(user.uri, minDate.toISOString(), maxDate.toISOString())

    if (events.length === 0) {
      log.info('No upcoming Calendly events found', { clientName: `${firstName} ${lastName}` })
      return 'no_calendly_events'
    }

    // Check which events already exist in DB
    const eventUris = events.map(e => e.uri)
    const { data: existingCalls } = await supabase
      .from('calls')
      .select('calendly_event_uri')
      .in('calendly_event_uri', eventUris)

    const existingUriSet = new Set(
      (existingCalls || []).map(c => c.calendly_event_uri)
    )

    let synced = 0
    for (const event of events) {
      if (existingUriSet.has(event.uri)) continue

      // Fetch invitees to match with this client
      let invitees
      try {
        invitees = await getEventInvitees(event.uri)
      } catch {
        continue
      }

      const activeInvitee = invitees.find(i => i.status === 'active')
      if (!activeInvitee) continue

      // Check if the invitee matches this client
      // Handle concatenated names like "GonzaloTeba" → "Gonzalo Teba"
      let invRawName = activeInvitee.name.trim()
      if (!invRawName.includes(' ') && /[a-z][A-Z]/.test(invRawName)) {
        invRawName = invRawName.replace(/([a-z])([A-Z])/g, '$1 $2')
      }
      const nameParts = invRawName.split(/\s+/)
      const invFirstName = nameParts[0] || ''
      const invLastName = nameParts.slice(1).join(' ') || ''

      // Simple fuzzy match against the check-in client
      const clientFull = `${firstName} ${lastName}`.toLowerCase().trim()
      const invFull = `${invFirstName} ${invLastName}`.toLowerCase().trim()

      const isMatch =
        clientFull === invFull ||
        clientFull.startsWith(invFull) ||
        invFull.startsWith(clientFull)

      if (!isMatch) continue

      const meetLink = extractMeetLink(event)
      const callDate = event.start_time.split('T')[0]

      const { error: insertError } = await supabase.from('calls').insert({
        client_id: clientId,
        coach_id: coachId,
        call_date: callDate,
        scheduled_at: event.start_time,
        calendly_event_uri: event.uri,
        meet_link: meetLink,
        duration_minutes: Math.round(
          (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000
        ),
        notes: `Llamada programada via Calendly: ${event.name}`,
      })

      if (insertError) {
        log.error('Failed to insert call from Calendly API sync', {
          clientId,
          error: insertError.message,
        })
        continue
      }

      synced++
      log.info('Synced Calendly event for client after check-in', {
        clientId,
        clientName: `${firstName} ${lastName}`,
        scheduledAt: event.start_time,
        eventUri: event.uri,
      })

      // Create upcoming_call alert
      const scheduledDate = new Date(event.start_time)
      const formattedDate = scheduledDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
      await supabase.from('alerts').insert({
        client_id: clientId,
        type: 'upcoming_call',
        severity: 'high',
        message: `Llamada programada con ${firstName} ${lastName} — ${formattedDate}`,
      })
    }

    if (synced > 0) {
      return `api_synced_${synced}_calls`
    }
    return 'no_matching_calendly_events'
  } catch (err) {
    log.error('Calendly API sync failed for client', {
      clientId,
      error: (err as Error).message,
    })
    return `api_sync_error: ${(err as Error).message}`
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
