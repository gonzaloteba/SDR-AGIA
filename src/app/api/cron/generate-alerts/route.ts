import { NextRequest, NextResponse } from 'next/server'
import { differenceInDays, startOfMonth, getWeekOfMonth } from 'date-fns'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
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
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('status', 'active')

  if (!clients || clients.length === 0) {
    return NextResponse.json({ message: 'No active clients', alerts_created: 0 })
  }

  // Get existing unresolved alerts to avoid duplicates
  const { data: existingAlerts } = await supabase
    .from('alerts')
    .select('client_id, type')
    .eq('is_resolved', false)

  const existingAlertSet = new Set(
    (existingAlerts || []).map((a) => `${a.client_id}:${a.type}`)
  )

  function alertExists(clientId: string, type: string) {
    return existingAlertSet.has(`${clientId}:${type}`)
  }

  // Get latest check-in per client
  const { data: allCheckins } = await supabase
    .from('check_ins')
    .select('client_id, submitted_at')
    .order('submitted_at', { ascending: false })

  const lastCheckinByClient = new Map<string, string>()
  for (const ci of allCheckins || []) {
    if (!lastCheckinByClient.has(ci.client_id)) {
      lastCheckinByClient.set(ci.client_id, ci.submitted_at)
    }
  }

  // Get calls this month per client
  const { data: monthCalls } = await supabase
    .from('calls')
    .select('client_id')
    .gte('call_date', monthStart)

  const callCountByClient = new Map<string, number>()
  for (const call of monthCalls || []) {
    callCountByClient.set(call.client_id, (callCountByClient.get(call.client_id) || 0) + 1)
  }

  // Get active training plans
  const { data: trainingPlans } = await supabase
    .from('training_plans')
    .select('client_id, end_date')
    .gte('end_date', now.toISOString().split('T')[0])

  const activePlanByClient = new Map<string, string>()
  for (const tp of trainingPlans || []) {
    activePlanByClient.set(tp.client_id, tp.end_date)
  }

  for (const client of clients) {
    const daysSinceStart = differenceInDays(now, new Date(client.start_date))
    const daysUntilEnd = differenceInDays(new Date(client.end_date), now)

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

    // 2. Phase change approaching (3 days before)
    if (!alertExists(client.id, 'phase_change') && client.phase_change_date) {
      const daysUntilPhaseChange = differenceInDays(
        new Date(client.phase_change_date),
        now
      )
      if (daysUntilPhaseChange >= 0 && daysUntilPhaseChange <= 3 && client.current_phase < 3) {
        const phaseNames: Record<number, string> = {
          2: 'Fase 2 - Reintroducción',
          3: 'Fase 3 - Low-Carb Flexible',
        }
        const nextPhase = client.current_phase + 1
        alertsToCreate.push({
          client_id: client.id,
          type: 'phase_change',
          severity: daysUntilPhaseChange <= 1 ? 'high' : 'medium',
          message: `${client.first_name} ${client.last_name} cambia a ${phaseNames[nextPhase] || `fase ${nextPhase}`} en ${daysUntilPhaseChange} días. Preparar indicaciones de alimentación.`,
        })
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
        const daysUntilPlanEnd = differenceInDays(new Date(planEndDate), now)
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

    // 5. No call logged this week (except week 4)
    if (!alertExists(client.id, 'no_call_logged')) {
      const weekOfMonth = getWeekOfMonth(now)
      if (weekOfMonth < 4) {
        const callsThisMonth = callCountByClient.get(client.id) || 0
        // Expected: at least (weekOfMonth - 1) calls by now if not first week
        const dayOfWeek = now.getDay()
        if (dayOfWeek >= 5 && callsThisMonth < weekOfMonth) {
          // It's Friday or later and calls are behind
          alertsToCreate.push({
            client_id: client.id,
            type: 'no_call_logged',
            severity: 'high',
            message: `${client.first_name} ${client.last_name}: ${callsThisMonth} llamadas registradas de ${weekOfMonth} esperadas este mes`,
          })
        }
      }
    }

    // 6. Onboarding incomplete (3+ days after start)
    if (!alertExists(client.id, 'onboarding_incomplete')) {
      if (daysSinceStart >= 3) {
        const incomplete =
          !client.onboarding_trainingpeaks ||
          !client.onboarding_whatsapp_group ||
          !client.onboarding_community_group
        if (incomplete) {
          const missing = []
          if (!client.onboarding_trainingpeaks) missing.push('TrainingPeaks')
          if (!client.onboarding_whatsapp_group) missing.push('WhatsApp 1:1')
          if (!client.onboarding_community_group) missing.push('Comunidad')
          alertsToCreate.push({
            client_id: client.id,
            type: 'onboarding_incomplete',
            severity: 'high',
            message: `Onboarding incompleto para ${client.first_name} ${client.last_name}: falta ${missing.join(', ')}`,
          })
        }
      }
    }

    // 7. Program ending (14 days before)
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
  }

  // Bulk insert alerts
  if (alertsToCreate.length > 0) {
    const { error } = await supabase.from('alerts').insert(alertsToCreate)
    if (error) {
      console.error('Error creating alerts:', error)
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
}
