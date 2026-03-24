'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, getScheduledEvents, getEventInvitees, extractMeetLink } from '@/lib/calendly'
import { findClientInList } from '@/lib/typeform-helpers'
import { runTypeformSync } from '@/lib/typeform-sync'
import { logger } from '@/lib/logger'

const log = logger('actions:settings')

export interface IntegrationStatus {
  calendly: {
    configured: boolean
    accountName: string | null
    error: string | null
  }
  typeform: {
    configured: boolean
    error: string | null
  }
  supabase: {
    configured: boolean
    clientCount: number | null
    callCount: number | null
  }
  envVars: Record<string, boolean>
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      calendly: { configured: false, accountName: null, error: 'No autenticado' },
      typeform: { configured: false, error: 'No autenticado' },
      supabase: { configured: false, clientCount: null, callCount: null },
      envVars: {},
    }
  }

  // Check env vars
  const envVars: Record<string, boolean> = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    TYPEFORM_WEBHOOK_SECRET: !!process.env.TYPEFORM_WEBHOOK_SECRET,
    TYPEFORM_API_TOKEN: !!process.env.TYPEFORM_API_TOKEN,
    CRON_SECRET: !!process.env.CRON_SECRET,
    CALENDLY_API_TOKEN: !!process.env.CALENDLY_API_TOKEN,
    GOOGLE_SCRIPT_SECRET: !!process.env.GOOGLE_SCRIPT_SECRET,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
  }

  // Check Calendly
  let calendly: IntegrationStatus['calendly'] = { configured: false, accountName: null, error: null }
  if (process.env.CALENDLY_API_TOKEN) {
    try {
      const calendlyUser = await getCurrentUser()
      calendly = { configured: true, accountName: calendlyUser.name, error: null }
    } catch (err) {
      calendly = { configured: false, accountName: null, error: (err as Error).message }
    }
  } else {
    calendly = { configured: false, accountName: null, error: 'CALENDLY_API_TOKEN no configurado' }
  }

  // Check Typeform
  const typeformConfigured = !!process.env.TYPEFORM_API_TOKEN && !!process.env.TYPEFORM_WEBHOOK_SECRET
  const typeform: IntegrationStatus['typeform'] = {
    configured: typeformConfigured,
    error: typeformConfigured ? null : 'Falta TYPEFORM_API_TOKEN o TYPEFORM_WEBHOOK_SECRET',
  }

  // Check Supabase data
  const adminClient = getAdminClient()
  const [clientsRes, callsRes] = await Promise.all([
    adminClient.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    adminClient.from('calls').select('id', { count: 'exact', head: true }),
  ])

  return {
    calendly,
    typeform,
    supabase: {
      configured: true,
      clientCount: clientsRes.count ?? 0,
      callCount: callsRes.count ?? 0,
    },
    envVars,
  }
}

export async function fixOrphanCalls(): Promise<{ success: boolean; message: string; fixed: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'No autenticado', fixed: 0 }
  }

  const adminClient = getAdminClient()

  // Get the coach id for the current user
  const { data: coachRow } = await adminClient
    .from('coaches')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!coachRow) {
    return { success: false, message: 'No eres un coach registrado', fixed: 0 }
  }

  // Find calls without coach_id
  const { data: orphanCalls, error } = await adminClient
    .from('calls')
    .select('id')
    .is('coach_id', null)

  if (error) {
    return { success: false, message: `Error: ${error.message}`, fixed: 0 }
  }

  if (!orphanCalls || orphanCalls.length === 0) {
    return { success: true, message: 'Todas las llamadas ya tienen coach asignado', fixed: 0 }
  }

  const { error: updateError } = await adminClient
    .from('calls')
    .update({ coach_id: coachRow.id })
    .is('coach_id', null)

  if (updateError) {
    return { success: false, message: `Error al actualizar: ${updateError.message}`, fixed: 0 }
  }

  log.info('Fixed orphan calls', { count: orphanCalls.length, coachId: coachRow.id })
  return { success: true, message: `${orphanCalls.length} llamada(s) asignadas a tu cuenta`, fixed: orphanCalls.length }
}

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
    const data = await runTypeformSync()
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

    // Check 7 days in the past to catch recent calls
    const minDate = new Date(now)
    minDate.setDate(minDate.getDate() - 7)

    // Resolve coach_id for the current user
    const { data: coachRow } = await adminClient
      .from('coaches')
      .select('id')
      .eq('id', user.id)
      .single()
    const coachId = coachRow?.id ?? null

    const calendlyUser = await getCurrentUser()
    const events = await getScheduledEvents(calendlyUser.uri, minDate.toISOString(), maxDate.toISOString())

    if (events.length === 0) {
      return { success: true, message: 'No hay eventos en Calendly (últimos 7 días + próximos 30 días)', synced: 0 }
    }

    // Load ALL clients for name matching (not just active — inactive clients may have calls too)
    const { data: clients } = await adminClient
      .from('clients')
      .select('id, first_name, last_name')

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

    const parts: string[] = []
    if (synced > 0) parts.push(`${synced} llamada(s) nueva(s) sincronizada(s)`)
    if (skipped > 0) parts.push(`${skipped} ya existente(s)`)
    if (unmatched > 0) parts.push(`${unmatched} sin cliente asociado`)
    if (parts.length === 0) parts.push('No hay llamadas nuevas para sincronizar')

    return {
      success: true,
      message: parts.join(', ') + ` (${events.length} evento(s) en Calendly)`,
      synced,
      skipped,
      unmatched,
    }
  } catch (err) {
    log.error('Manual Calendly sync failed', { error: (err as Error).message })
    return { success: false, message: `Error: ${(err as Error).message}` }
  }
}
