import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, getScheduledEvents, getEventInvitees, extractMeetLink } from '@/lib/calendly'
import { findClientInList } from '@/lib/typeform-helpers'
import { logger } from '@/lib/logger'

const log = logger('api:calendly:sync')

export async function POST(request: NextRequest) {
  try {
    // Auth: cron secret or session-based
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()
    const now = new Date()

    // Fetch next 30 days of events from Calendly
    const maxDate = new Date(now)
    maxDate.setDate(maxDate.getDate() + 30)

    const user = await getCurrentUser()
    log.info('Calendly user resolved', { name: user.name, uri: user.uri })

    const events = await getScheduledEvents(
      user.uri,
      now.toISOString(),
      maxDate.toISOString(),
    )

    if (events.length === 0) {
      return NextResponse.json({ message: 'No upcoming events', synced: 0 })
    }

    // Load all active clients for name matching
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('status', 'active')

    if (clientsError) {
      log.error('Failed to fetch clients', { error: clientsError.message })
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // Check existing calls with calendly_event_uri to avoid duplicates
    const eventUris = events.map(e => e.uri)
    const { data: existingCalls } = await supabase
      .from('calls')
      .select('calendly_event_uri')
      .in('calendly_event_uri', eventUris)

    const existingUriSet = new Set(
      (existingCalls || []).map(c => c.calendly_event_uri)
    )

    let synced = 0
    let skipped = 0
    let unmatched = 0

    for (const event of events) {
      if (existingUriSet.has(event.uri)) {
        skipped++
        continue
      }

      // Get invitees to match with clients
      let invitees
      try {
        invitees = await getEventInvitees(event.uri)
      } catch (err) {
        log.warn('Failed to fetch invitees for event', {
          eventUri: event.uri,
          error: (err as Error).message,
        })
        continue
      }

      const activeInvitee = invitees.find(i => i.status === 'active')
      if (!activeInvitee) {
        log.warn('No active invitee for event', { eventUri: event.uri })
        continue
      }

      // Try to match invitee name to a client
      const nameParts = activeInvitee.name.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const matchedClient = findClientInList(clients || [], firstName, lastName)

      if (!matchedClient) {
        log.warn('Could not match Calendly invitee to client', {
          inviteeName: activeInvitee.name,
          inviteeEmail: activeInvitee.email,
        })
        unmatched++
        continue
      }

      const meetLink = extractMeetLink(event)
      const callDate = event.start_time.split('T')[0]

      const { error: insertError } = await supabase.from('calls').insert({
        client_id: matchedClient.id,
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
        log.error('Failed to insert call from Calendly', {
          clientId: matchedClient.id,
          eventUri: event.uri,
          error: insertError.message,
        })
        continue
      }

      synced++
      log.info('Synced Calendly event to call', {
        clientId: matchedClient.id,
        clientName: `${firstName} ${lastName}`,
        scheduledAt: event.start_time,
      })
    }

    return NextResponse.json({
      message: 'Calendly sync complete',
      total_events: events.length,
      synced,
      skipped,
      unmatched,
    })
  } catch (err) {
    log.error('Calendly sync failed', { error: (err as Error).message })
    return NextResponse.json(
      { error: 'Internal server error', detail: (err as Error).message },
      { status: 500 }
    )
  }
}
