import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { PHASE_DURATIONS_DAYS } from '@/lib/constants'
import type { NutritionPhase } from '@/lib/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

// -1 = indefinido (no phase change date)
const INDEFINITE = -1

// PATCH /api/clients/[id]/phase
// Body: { phase?: 1|2|3, custom_phase_duration_days?: number | null }
// custom_phase_duration_days: -1 = indefinido, null = use default, positive = custom days
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()
  const { phase, custom_phase_duration_days } = body as {
    phase?: NutritionPhase
    custom_phase_duration_days?: number | null
  }

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
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Determine duration: custom or default
      const duration = custom_phase_duration_days ?? PHASE_DURATIONS_DAYS[phase]
      const changeDate = new Date()
      changeDate.setDate(changeDate.getDate() + duration)
      const phaseChangeDate = changeDate.toISOString().split('T')[0]

      // The DB trigger fires on current_phase change and would override phase_change_date.
      // We update custom_phase_duration_days so the trigger uses it, OR if null the trigger
      // uses start_date-based defaults. To be safe, we also explicitly set phase_change_date
      // after the trigger via a second update.
      const { error } = await supabase
        .from('clients')
        .update({
          current_phase: phase,
          custom_phase_duration_days: custom_phase_duration_days ?? null,
        })
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Explicitly set phase_change_date (trigger may have set a different value for null custom)
      if (custom_phase_duration_days && custom_phase_duration_days > 0) {
        await supabase
          .from('clients')
          .update({ phase_change_date: phaseChangeDate })
          .eq('id', id)
      }
    }

    // Resolve existing phase_change alerts
    await supabase
      .from('alerts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('client_id', id)
      .eq('type', 'phase_change')
      .eq('is_resolved', false)

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
      const { data: client } = await supabase
        .from('clients')
        .select('current_phase')
        .eq('id', id)
        .single()

      if (!client) {
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
    await supabase
      .from('alerts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('client_id', id)
      .eq('type', 'phase_change')
      .eq('is_resolved', false)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
}
