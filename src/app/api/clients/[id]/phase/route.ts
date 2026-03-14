import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PHASE_DURATIONS_DAYS } from '@/lib/constants'
import type { NutritionPhase } from '@/lib/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/clients/[id]/phase
// Body: { phase?: 1|2|3, custom_phase_duration_days?: number | null }
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()
  const { phase, custom_phase_duration_days } = body as {
    phase?: NutritionPhase
    custom_phase_duration_days?: number | null
  }

  const supabase = await createClient()

  // If changing phase
  if (phase !== undefined) {
    if (![1, 2, 3].includes(phase)) {
      return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
    }

    // Determine the duration for the new phase
    const duration = custom_phase_duration_days ?? PHASE_DURATIONS_DAYS[phase]
    const today = new Date().toISOString().split('T')[0]
    const changeDate = new Date()
    changeDate.setDate(changeDate.getDate() + duration)
    const phaseChangeDate = changeDate.toISOString().split('T')[0]

    // Update phase + custom duration + phase_change_date
    // We set phase_change_date explicitly, but the trigger will also fire.
    // To make the trigger use our custom duration, we set custom_phase_duration_days first.
    const updateData: Record<string, unknown> = {
      current_phase: phase,
      custom_phase_duration_days: custom_phase_duration_days ?? null,
    }

    const { error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no custom duration and the trigger will use start_date-based calc, that's fine.
    // If custom duration is set, the trigger handles it.

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
    // Get client's current phase
    const { data: client } = await supabase
      .from('clients')
      .select('current_phase')
      .eq('id', id)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Calculate new phase_change_date from today + custom days
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
