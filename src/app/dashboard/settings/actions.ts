'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, getScheduledEvents, getEventInvitees, extractMeetLink } from '@/lib/calendly'
import { findClientInList } from '@/lib/typeform-helpers'
import { logger } from '@/lib/logger'

const log = logger('actions:calendly-sync')

export async function syncTypeformNow(): Promise<{
  success: boolean
  message: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'No autenticado' }
  }

  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return { success: false, message: 'CRON_SECRET no configurado' }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'

    const res = await fetch(`${baseUrl}/api/sync/typeform`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cronSecret}` },
    })

    if (!res.ok) {
      const text = await res.text()
      return { success: false, message: `Error ${res.status}: ${text}` }
    }

    const data = await res.json()
    const r = data.results
    const parts: string[] = []
    if (r?.audit?.created > 0) parts.push(`${r.audit.created} cliente(s) nuevo(s)`)
    if (r?.audit?.updated > 0) parts.push(`${r.audit.updated} auditoría(s) actualizada(s)`)
    if (r?.checkin?.inserted > 0) parts.push(`${r.checkin.inserted} check-in(s) sincronizado(s)`)
    if (parts.length === 0) parts.push('No hay datos nuevos')

    return { success: true, message: parts.join(', ') }
  } catch (err) {
    log.error('Manual Typeform sync failed', { error: (err as Error).message })
    return { success: false, message: `Error: ${(err as Error).message}` }
  }
}

export async function syncCalendlyNow(): Promise<{
  success: boolean
  message: string
  synced?: number
  skipped?: number
  unmatched?: number
}> {
  // Verify authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'No autenticado' }
  }

  try {
    const adminClient = getAdminClient()
    const now = new Date()
    const maxDate = new Date(now)
    maxDate.setDate(maxDate.getDate() + 30)

    // Also check 24h in the past
    const minDate = new Date(now)
    minDate.setHours(minDate.getHours() - 24)

    const calendlyUser = await getCurrentUser()
    const events = await getScheduledEvents(calendlyUser.uri, minDate.toISOString(), maxDate.toISOString())

    if (events.length === 0) {
      return { success: true, message: 'No hay eventos en Calendly', synced: 0 }
    }

    // Load all active clients for name matching
    const { data: clients } = await adminClient
      .from('clients')
      .select('id, first_name, last_name')
      .eq('status', 'active')

    // Check existing calls
    const eventUris = events.map(e => e.uri)
    const { data: existingCalls } = await adminClient
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

      let invitees
      try {
        invitees = await getEventInvitees(event.uri)
      } catch {
        continue
      }

      const activeInvitee = invitees.find(i => i.status === 'active')
      if (!activeInvitee) continue

      const nameParts = activeInvitee.name.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const matchedClient = findClientInList(clients || [], firstName, lastName)

      if (!matchedClient) {
        log.warn('Could not match Calendly invitee', {
          inviteeName: activeInvitee.name,
          inviteeEmail: activeInvitee.email,
        })
        unmatched++
        continue
      }

      const meetLink = extractMeetLink(event)
      const callDate = event.start_time.split('T')[0]

      const { error: insertError } = await adminClient.from('calls').insert({
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
        log.error('Failed to insert call', { error: insertError.message })
        continue
      }

      synced++
      log.info('Manual sync: created call', {
        clientId: matchedClient.id,
        clientName: `${firstName} ${lastName}`,
        scheduledAt: event.start_time,
      })
    }

    return {
      success: true,
      message: synced > 0
        ? `Sincronizadas ${synced} llamada(s) nuevas`
        : 'No hay llamadas nuevas para sincronizar',
      synced,
      skipped,
      unmatched,
    }
  } catch (err) {
    log.error('Manual Calendly sync failed', { error: (err as Error).message })
    return { success: false, message: `Error: ${(err as Error).message}` }
  }
}
