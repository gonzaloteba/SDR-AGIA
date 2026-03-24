import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getAdminClient } from '@/lib/supabase/admin'
import { getEventInvitees, extractMeetLink } from '@/lib/calendly'
import { findClientInList } from '@/lib/typeform-helpers'
import { escapeLikePattern } from '@/lib/api-auth'
import { logger } from '@/lib/logger'

const log = logger('api:webhooks:calendly')

interface CalendlyWebhookPayload {
  event: string
  payload: {
    event: string
    name: string
    status: string
    start_time: string
    end_time: string
    uri: string
    location?: {
      type: string
      join_url?: string
    }
  }
}

/**
 * Verify Calendly webhook signature (HMAC SHA256).
 * Returns true if valid or if no signing key is configured (backwards compat).
 */
function verifyCalendlySignature(rawBody: string, signatureHeader: string | null): boolean {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY
  if (!signingKey) {
    // No signing key configured — allow request but log warning
    log.warn('CALENDLY_WEBHOOK_SIGNING_KEY not configured — webhook signature verification skipped')
    return true
  }

  if (!signatureHeader) {
    log.error('Missing Calendly-Webhook-Signature header')
    return false
  }

  // Calendly signature format: "t=<timestamp>,v1=<signature>"
  const parts: Record<string, string> = {}
  for (const part of signatureHeader.split(',')) {
    const [key, ...valueParts] = part.split('=')
    parts[key] = valueParts.join('=')
  }

  const timestamp = parts['t']
  const v1Signature = parts['v1']

  if (!timestamp || !v1Signature) {
    log.error('Invalid Calendly-Webhook-Signature format', { signatureHeader })
    return false
  }

  // Verify signature: HMAC SHA256 of "timestamp.body"
  const expectedSig = createHmac('sha256', signingKey)
    .update(timestamp + '.' + rawBody)
    .digest('hex')

  if (v1Signature !== expectedSig) {
    log.error('Calendly webhook signature mismatch')
    return false
  }

  // Optional: reject old timestamps (5 minute tolerance)
  const timestampMs = parseInt(timestamp, 10) * 1000
  if (!isNaN(timestampMs) && Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    log.warn('Calendly webhook timestamp too old', { timestamp })
    return false
  }

  return true
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Verify webhook signature
    const signatureHeader = request.headers.get('Calendly-Webhook-Signature')
    if (!verifyCalendlySignature(rawBody, signatureHeader)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: CalendlyWebhookPayload
    try {
      body = JSON.parse(rawBody) as CalendlyWebhookPayload
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { event: eventType, payload } = body

    log.info('Calendly webhook received', { eventType, eventUri: payload?.uri })

    if (!payload?.uri) {
      return NextResponse.json({ error: 'Missing event URI' }, { status: 400 })
    }

    const supabase = getAdminClient()

    if (eventType === 'invitee.created') {
      // New booking — create a call record
      const eventUri = payload.event || payload.uri

      // Check if we already have this event
      const { data: existing } = await supabase
        .from('calls')
        .select('id')
        .eq('calendly_event_uri', eventUri)
        .limit(1)
        .maybeSingle()

      if (existing) {
        log.info('Event already exists, skipping', { eventUri })
        return NextResponse.json({ message: 'Already synced' })
      }

      // Fetch invitees to match with client
      let invitees: Awaited<ReturnType<typeof getEventInvitees>>
      try {
        invitees = await getEventInvitees(eventUri)
      } catch {
        log.warn('Could not fetch invitees from Calendly API', { eventUri })
        invitees = []
      }

      // Load clients for matching (all clients, not just active)
      const { data: clients } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')

      const activeInvitee = invitees.find(i => i.status === 'active')
      let matchedClient: { id: string } | null = null

      if (activeInvitee && clients) {
        // Handle concatenated names like "GonzaloTeba" → "Gonzalo Teba"
        let rawName = activeInvitee.name.trim()
        if (!rawName.includes(' ') && /[a-z][A-Z]/.test(rawName)) {
          rawName = rawName.replace(/([a-z])([A-Z])/g, '$1 $2')
        }
        const nameParts = rawName.split(/\s+/)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        matchedClient = findClientInList(clients, firstName, lastName)

        // Fallback: email matching
        if (!matchedClient && activeInvitee.email) {
          const emailLower = activeInvitee.email.toLowerCase().trim()
          const emailMatch = clients.find(
            c => c.email && c.email.toLowerCase().trim() === emailLower
          )
          if (emailMatch) matchedClient = { id: emailMatch.id }
        }
      }

      if (!matchedClient) {
        log.warn('Could not match Calendly invitee to client', {
          inviteeName: activeInvitee?.name,
          inviteeEmail: activeInvitee?.email,
          eventUri,
        })
        return NextResponse.json({
          message: 'Event received but could not match client',
          eventUri,
        })
      }

      const meetLink = payload.location?.join_url || null
      const callDate = payload.start_time.split('T')[0]

      // Get coach_id from the client's assigned coach
      const { data: clientRow } = await supabase
        .from('clients')
        .select('coach_id')
        .eq('id', matchedClient.id)
        .single()

      const { error: insertError } = await supabase.from('calls').insert({
        client_id: matchedClient.id,
        coach_id: clientRow?.coach_id ?? null,
        call_date: callDate,
        scheduled_at: payload.start_time,
        calendly_event_uri: eventUri,
        meet_link: meetLink,
        duration_minutes: Math.round(
          (new Date(payload.end_time).getTime() - new Date(payload.start_time).getTime()) / 60000
        ),
        notes: `Llamada programada via Calendly: ${payload.name}`,
      })

      if (insertError) {
        log.error('Failed to insert call', { error: insertError.message })
        return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
      }

      log.info('Created call from Calendly webhook', {
        clientId: matchedClient.id,
        scheduledAt: payload.start_time,
      })

      return NextResponse.json({ message: 'Call created', clientId: matchedClient.id })
    }

    if (eventType === 'invitee.canceled') {
      // Cancellation — remove the scheduled call
      const eventUri = payload.event || payload.uri

      const { data: call } = await supabase
        .from('calls')
        .select('id, client_id')
        .eq('calendly_event_uri', eventUri)
        .limit(1)
        .maybeSingle()

      if (call) {
        await supabase.from('calls').delete().eq('id', call.id)
        log.info('Deleted canceled Calendly call', { callId: call.id, eventUri })

        // Resolve upcoming_call alerts for this client (safe — uses client_id, not ilike)
        if (call.client_id) {
          await supabase
            .from('alerts')
            .update({ is_resolved: true, resolved_at: new Date().toISOString() })
            .eq('client_id', call.client_id)
            .eq('type', 'upcoming_call')
            .eq('is_resolved', false)
        }
      }

      return NextResponse.json({ message: 'Canceled event processed' })
    }

    log.info('Unhandled Calendly event type', { eventType })
    return NextResponse.json({ message: 'Event type not handled' })
  } catch (err) {
    log.error('Calendly webhook failed', { error: (err as Error).message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
