import { NextRequest, NextResponse } from 'next/server'
import { differenceInDays, startOfMonth, getWeekOfMonth } from 'date-fns'
import { getAdminClient } from '@/lib/supabase/admin'

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
      console.error('Failed to fetch clients:', clientsError.message)
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
      console.error('Failed to fetch existing alerts:', alertsError.message)
    }

    const existingAlertSet = new Set(
      (existingAlerts || []).map((a) => `${a.client_id}:${a.type}`)
    )

    function alertExists(clientId: string, type: string) {
      return existingAlertSet.has(`${clientId}:${type}`)
    }

    // Get latest check-in per client
    const { data: allCheckins, error: checkinsError } = await supabase
      .from('check_ins')
      .select('client_id, submitted_at')
      .order('submitted_at', { ascending: false })

    if (checkinsError) {
      console.error('Failed to fetch check-ins:', checkinsError.message)
    }

    const lastCheckinByClient = new Map<string, string>()
    for (const ci of allCheckins || []) {
      if (!lastCheckinByClient.has(ci.client_id)) {
        lastCheckinByClient.set(ci.client_id, ci.submitted_at)
      }
    }

    // Get calls this month per client
    const { data: monthCalls, error: callsError } = await supabase
      .from('calls')
      .select('client_id')
      .gte('call_date', monthStart)

    if (callsError) {
      console.error('Failed to fetch calls:', callsError.message)
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
      console.error('Failed to fetch training plans:', plansError.message)
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
          console.error(`Client ${client.id} has invalid dates: start=${client.start_date}, end=${client.end_date}`)
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

          if (daysSinceCheckin >= 8) {
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
              ? Math.min(3, client.custom_phase_duration_days)
              : 3
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

        // 5. No call logged this week (except week 4)
        if (!alertExists(client.id, 'no_call_logged')) {
          const weekOfMonth = getWeekOfMonth(now)
          if (weekOfMonth < 4) {
            const callsThisMonth = callCountByClient.get(client.id) || 0
            const dayOfWeek = now.getDay()
            if (dayOfWeek >= 5 && callsThisMonth < weekOfMonth) {
              alertsToCreate.push({
                client_id: client.id,
                type: 'no_call_logged',
                severity: 'high',
                message: `${client.first_name} ${client.last_name}: ${callsThisMonth} llamadas registradas de ${weekOfMonth} esperadas este mes`,
              })
            }
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
        console.error(`Error processing alerts for client ${client.id}:`, e)
        continue
      }
    }

    // Bulk insert alerts
    if (alertsToCreate.length > 0) {
      const { error } = await supabase.from('alerts').insert(alertsToCreate)
      if (error) {
        return NextResponse.json(
          { error: 'Failed to create alerts', detail: error.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: `Alert generation complete`,
      alerts_created: alertsToCreate.length,
    })
  } catch (e) {
    console.error('Alert generation failed:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
