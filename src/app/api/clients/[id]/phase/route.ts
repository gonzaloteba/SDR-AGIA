import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { PHASE_DURATIONS_DAYS } from '@/lib/constants'
import { phaseUpdateSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import type { NutritionPhase } from '@/lib/types'

const log = logger('api:phase')

interface RouteContext {
  params: Promise<{ id: string }>
}

// -1 = indefinido (no phase change date)
const INDEFINITE = -1

// PATCH /api/clients/[id]/phase
// Body: { phase?: 1|2|3, custom_phase_duration_days?: number | null }
// custom_phase_duration_days: -1 = indefinido, null = use default, positive = custom days
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Verify authenticated user owns this client (or is admin)
    const userSupabase = await createClient()
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    if (authError || !user) {
      log.error('Auth failed', { error: authError?.message ?? 'No user', clientId: id })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Use admin client for role check to avoid RLS restrictions on coaches table
    const adminSupa = getAdminClient()
    const { data: coach, error: coachError } = await adminSupa.from('coaches').select('role').eq('id', user.id).single()
    if (coachError) {
      log.error('Coach lookup failed', { error: coachError.message, userId: user.id })
    }
    if (coach?.role !== 'admin') {
      const { data: client, error: clientError } = await adminSupa.from('clients').select('coach_id').eq('id', id).single()
      if (clientError) {
        log.error('Client lookup failed', { error: clientError.message, clientId: id })
      }
      if (!client || client.coach_id !== user.id) {
        log.error('Forbidden: coach_id mismatch', { clientCoachId: client?.coach_id, userId: user.id, clientId: id })
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = phaseUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues.map(e => e.message) },
        { status: 400 }
      )
    }

    const { phase, custom_phase_duration_days } = parsed.data

    const supabase = getAdminClient()

    // If changing phase
    if (phase !== undefined) {
      if (![1, 2, 3].includes(phase)) {
        return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
      }

      const isIndefinite = custom_phase_duration_days === INDEFINITE || (phase === 3 && custom_phase_duration_days === undefined)

      if (isIndefinite) {
        // Indefinite: no phase_change_date, store -1 as sentinel
        const { error } = await supabase
          .from('clients')
          .update({
            current_phase: phase,
            custom_phase_duration_days: INDEFINITE,
            phase_change_date: null,
          })
          .eq('id', id)

        if (error) {
          log.error('DB update failed (indefinite)', { error: error.message, code: error.code, clientId: id, phase })
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      } else {
        // Determine duration: custom or default
        const duration = custom_phase_duration_days ?? PHASE_DURATIONS_DAYS[phase]
        const changeDate = new Date()
        changeDate.setDate(changeDate.getDate() + duration)
        const phaseChangeDate = changeDate.toISOString().split('T')[0]

        log.info('Updating phase', { clientId: id, phase, duration, phaseChangeDate, custom_phase_duration_days: custom_phase_duration_days ?? null })

        const { error } = await supabase
          .from('clients')
          .update({
            current_phase: phase,
            custom_phase_duration_days: custom_phase_duration_days ?? null,
            phase_change_date: phaseChangeDate,
          })
          .eq('id', id)

        if (error) {
          log.error('DB update failed', { error: error.message, code: error.code, clientId: id, phase, duration })
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }

      // Resolve existing phase_change alerts
      const { error: alertError } = await supabase
        .from('alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('client_id', id)
        .eq('type', 'phase_change')
        .eq('is_resolved', false)

      if (alertError) {
        log.error('Failed to resolve phase_change alerts', { error: alertError.message, clientId: id })
      }

      revalidatePath(`/dashboard/clients/${id}`)
      return NextResponse.json({ success: true })
    }

    // If only updating interval (not changing phase)
    if (custom_phase_duration_days !== undefined) {
      const isIndefinite = custom_phase_duration_days === INDEFINITE

      if (isIndefinite) {
        const { error } = await supabase
          .from('clients')
          .update({
            custom_phase_duration_days: INDEFINITE,
            phase_change_date: null,
          })
          .eq('id', id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      } else {
        // Get client's current phase for default duration
        const { data: client, error: fetchError } = await supabase
          .from('clients')
          .select('current_phase')
          .eq('id', id)
          .single()

        if (fetchError || !client) {
          return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        const duration = custom_phase_duration_days ?? PHASE_DURATIONS_DAYS[client.current_phase as NutritionPhase]
        const changeDate = new Date()
        changeDate.setDate(changeDate.getDate() + duration)
        const phaseChangeDate = changeDate.toISOString().split('T')[0]

        const { error } = await supabase
          .from('clients')
          .update({
            custom_phase_duration_days: custom_phase_duration_days ?? null,
            phase_change_date: phaseChangeDate,
          })
          .eq('id', id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }

      // Resolve existing phase_change alerts so cron regenerates with new interval
      const { error: alertError } = await supabase
        .from('alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('client_id', id)
        .eq('type', 'phase_change')
        .eq('is_resolved', false)

      if (alertError) {
        log.error('Failed to resolve phase_change alerts', { error: alertError.message, clientId: id })
      }

      revalidatePath(`/dashboard/clients/${id}`)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
  } catch (e) {
    log.error('Phase update error', { error: (e as Error).message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
