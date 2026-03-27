import { NextRequest, NextResponse } from 'next/server'
import { differenceInDays, startOfMonth, getWeekOfMonth } from 'date-fns'
import { getAdminClient } from '@/lib/supabase/admin'
import { CHECKIN_GRACE_DAYS, PHASE_ALERT_DAYS_BEFORE } from '@/lib/constants'
import { logger } from '@/lib/logger'

export const maxDuration = 30

const log = logger('api:cron:generate-alerts')

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()
    const now = new Date()
    const monthStart = startOfMonth(now).toISOString().split('T')[0]
    const alertsToCreate: {
      client_id: string
      type: string
      severity: string
      message: string
    }[] = []

    // Get all active clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active')

    if (clientsError) {
      log.error('Failed to fetch clients', { error: clientsError.message })
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json({ message: 'No active clients', alerts_created: 0 })
    }

    // Get existing unresolved alerts to avoid duplicates
    const { data: existingAlerts, error: alertsError } = await supabase
      .from('alerts')
      .select('client_id, type')
      .eq('is_resolved', false)

    if (alertsError) {
      log.error('Failed to fetch existing alerts', { error: alertsError.message })
    }

    const existingAlertSet = new Set(
      (existingAlerts || []).map((a) => `${a.client_id}:${a.type}`)
    )

    function alertExists(clientId: string, type: string) {
      return existingAlertSet.has(`${clientId}:${type}`)
    }

    // Get latest check-in per client (optimized with DISTINCT ON)
    const { data: latestCheckins, error: checkinsError } = await supabase
      .rpc('get_latest_checkin_per_client')

    if (checkinsError) {
      log.error('Failed to fetch latest check-ins', { error: checkinsError.message })
    }

    const lastCheckinByClient = new Map<string, string>()
    for (const ci of (latestCheckins || []) as { client_id: string; latest_submitted_at: string }[]) {
      lastCheckinByClient.set(ci.client_id, ci.latest_submitted_at)
    }

    // Get calls this month per client
    const { data: monthCalls, error: callsError } = await supabase
      .from('calls')
      .select('client_id')
      .gte('call_date', monthStart)

    if (callsError) {
      log.error('Failed to fetch calls', { error: callsError.message })
    }

    const callCountByClient = new Map<string, number>()
    for (const call of monthCalls || []) {
      callCountByClient.set(call.client_id, (callCountByClient.get(call.client_id) || 0) + 1)
    }

    // Get active training plans
    const { data: trainingPlans, error: plansError } = await supabase
      .from('training_plans')
      .select('client_id, end_date')
      .gte('end_date', now.toISOString().split('T')[0])

    if (plansError) {
      log.error('Failed to fetch training plans', { error: plansError.message })
    }

    const activePlanByClient = new Map<string, string>()
    for (const tp of trainingPlans || []) {
      activePlanByClient.set(tp.client_id, tp.end_date)
    }

    for (const client of clients) {
      try {
        const startDate = new Date(client.start_date)
        const endDate = new Date(client.end_date)

        // Skip clients with invalid dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          log.warn('Client has invalid dates', { clientId: client.id, start: client.start_date, end: client.end_date })
          continue
        }

        const daysSinceStart = differenceInDays(now, startDate)
        const daysUntilEnd = differenceInDays(endDate, now)

        // 1. Missed check-in (8+ days without check-in)
        if (!alertExists(client.id, 'missed_checkin')) {
          const lastCheckin = lastCheckinByClient.get(client.id)
          const daysSinceCheckin = lastCheckin
            ? differenceInDays(now, new Date(lastCheckin))
            : daysSinceStart

          if (daysSinceCheckin >= CHECKIN_GRACE_DAYS) {
            alertsToCreate.push({
              client_id: client.id,
              type: 'missed_checkin',
              severity: 'high',
              message: `${client.first_name} ${client.last_name} no ha enviado check-in en ${daysSinceCheckin} días`,
            })
          }
        }

        // 2. Phase change approaching (uses custom alert window or default 3 days)
        // Skip if indefinite (-1) or no phase_change_date
        if (!alertExists(client.id, 'phase_change') && client.phase_change_date && client.custom_phase_duration_days !== -1) {
          const phaseChangeDate = new Date(client.phase_change_date)
          if (!isNaN(phaseChangeDate.getTime())) {
            const daysUntilPhaseChange = differenceInDays(phaseChangeDate, now)
            const alertWindow = client.custom_phase_duration_days && client.custom_phase_duration_days > 0
              ? Math.min(PHASE_ALERT_DAYS_BEFORE, client.custom_phase_duration_days)
              : PHASE_ALERT_DAYS_BEFORE
            if (daysUntilPhaseChange >= 0 && daysUntilPhaseChange <= alertWindow && client.current_phase < 3) {
              const phaseNames: Record<number, string> = {
                2: 'Fase 2 - Reintroducción',
                3: 'Fase 3 - Optimización',
              }
              const nextPhase = client.current_phase + 1
              const customNote = client.custom_phase_duration_days ? ' (intervalo personalizado)' : ''
              alertsToCreate.push({
                client_id: client.id,
                type: 'phase_change',
                severity: daysUntilPhaseChange <= 1 ? 'high' : 'medium',
                message: `${client.first_name} ${client.last_name} cambia a ${phaseNames[nextPhase] || `fase ${nextPhase}`} en ${daysUntilPhaseChange} días${customNote}. Preparar indicaciones de alimentación.`,
              })
            }
          }
        }

        // 3. Renewal approaching (21 days before program end)
        if (!alertExists(client.id, 'renewal_approaching')) {
          if (daysUntilEnd >= 0 && daysUntilEnd <= 21) {
            alertsToCreate.push({
              client_id: client.id,
              type: 'renewal_approaching',
              severity: 'medium',
              message: `Contactar a ${client.first_name} ${client.last_name} para renovación (programa termina en ${daysUntilEnd} días)`,
            })
          }
        }

        // 4. Training plan expiring (7 days before)
        if (!alertExists(client.id, 'training_plan_expiring')) {
          const planEndDate = activePlanByClient.get(client.id)
          if (planEndDate) {
            const planEnd = new Date(planEndDate)
            if (!isNaN(planEnd.getTime())) {
              const daysUntilPlanEnd = differenceInDays(planEnd, now)
              if (daysUntilPlanEnd >= 0 && daysUntilPlanEnd <= 7) {
                alertsToCreate.push({
                  client_id: client.id,
                  type: 'training_plan_expiring',
                  severity: 'medium',
                  message: `Plan de entrenamiento de ${client.first_name} ${client.last_name} vence en ${daysUntilPlanEnd} días`,
                })
              }
            }
          }
        }

        // 5. No call logged (2 calls expected per month)
        if (!alertExists(client.id, 'no_call_logged')) {
          const weekOfMonth = getWeekOfMonth(now)
          // Expect 1 call by week 2, 2 calls by week 4
          const expectedCalls = Math.min(2, Math.ceil(weekOfMonth / 2))
          const callsThisMonth = callCountByClient.get(client.id) || 0
          const dayOfWeek = now.getDay()
          if (dayOfWeek >= 5 && callsThisMonth < expectedCalls) {
            alertsToCreate.push({
              client_id: client.id,
              type: 'no_call_logged',
              severity: 'high',
              message: `${client.first_name} ${client.last_name}: ${callsThisMonth} llamadas registradas de ${expectedCalls} esperadas este mes`,
            })
          }
        }

        // 6. Program ending (14 days before)
        if (!alertExists(client.id, 'program_ending')) {
          if (daysUntilEnd >= 0 && daysUntilEnd <= 14) {
            alertsToCreate.push({
              client_id: client.id,
              type: 'program_ending',
              severity: 'low',
              message: `Programa de ${client.first_name} ${client.last_name} termina en ${daysUntilEnd} días`,
            })
          }
        }

        // 7. Birthday today
        if (!alertExists(client.id, 'birthday') && client.birth_date) {
          const birth = new Date(client.birth_date + 'T12:00:00')
          if (!isNaN(birth.getTime()) && birth.getMonth() === now.getMonth() && birth.getDate() === now.getDate()) {
            const age = now.getFullYear() - birth.getFullYear()
            alertsToCreate.push({
              client_id: client.id,
              type: 'birthday',
              severity: 'low',
              message: `¡Hoy es el cumpleaños de ${client.first_name} ${client.last_name}! Cumple ${age} años 🎂`,
            })
          }
        }
      } catch (e) {
        log.error('Error processing alerts for client', { clientId: client.id, error: (e as Error).message })
        continue
      }
    }

    // 8. Upcoming scheduled calls (next 24 hours)
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: upcomingCalls, error: upcomingCallsError } = await supabase
      .from('calls')
      .select('client_id, scheduled_at, calendly_event_uri')
      .not('scheduled_at', 'is', null)
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', tomorrow.toISOString())

    if (upcomingCallsError) {
      log.error('Failed to fetch upcoming calls', { error: upcomingCallsError.message })
    }

    for (const call of upcomingCalls || []) {
      if (!alertExists(call.client_id, 'upcoming_call')) {
        const client = clients.find(c => c.id === call.client_id)
        if (!client) continue

        const scheduledDate = new Date(call.scheduled_at)
        const formattedTime = scheduledDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

        alertsToCreate.push({
          client_id: call.client_id,
          type: 'upcoming_call',
          severity: 'medium',
          message: `Llamada programada con ${client.first_name} ${client.last_name} hoy a las ${formattedTime}`,
        })
      }
    }

    // Bulk insert alerts
    if (alertsToCreate.length > 0) {
      const { error } = await supabase.from('alerts').insert(alertsToCreate)
      if (error) {
        log.error('Failed to insert alerts', { error: error.message })
        return NextResponse.json(
          { error: 'Failed to create alerts' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: `Alert generation complete`,
      alerts_created: alertsToCreate.length,
    })
  } catch (e) {
    log.error('Alert generation failed', { error: (e as Error).message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
