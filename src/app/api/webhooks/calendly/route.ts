import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getEventInvitees, extractMeetLink } from '@/lib/calendly'
import { findClientInList } from '@/lib/typeform-helpers'
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CalendlyWebhookPayload
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

      // Load clients for matching
      const { data: clients } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('status', 'active')

      const activeInvitee = invitees.find(i => i.status === 'active')
      let matchedClient: { id: string } | null = null

      if (activeInvitee && clients) {
        const nameParts = activeInvitee.name.trim().split(/\s+/)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        matchedClient = findClientInList(clients, firstName, lastName)
      }

      if (!matchedClient) {
        log.warn('Could not match Calendly invitee to client', {
          inviteeName: activeInvitee?.name,
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
        .select('id')
        .eq('calendly_event_uri', eventUri)
        .limit(1)
        .maybeSingle()

      if (call) {
        await supabase.from('calls').delete().eq('id', call.id)
        log.info('Deleted canceled Calendly call', { callId: call.id, eventUri })

        // Also resolve any upcoming_call alerts for this
        await supabase
          .from('alerts')
          .update({ is_resolved: true, resolved_at: new Date().toISOString() })
          .eq('type', 'upcoming_call')
          .ilike('message', `%${eventUri}%`)
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
