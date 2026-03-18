import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const log = logger('api:migrate:assign-coach')

// POST /api/migrate/assign-coach
// Assigns all unassigned clients to a coach.
// Body: { coach_name: string } - matches against coaches.full_name (case-insensitive)
// Or:   { coach_id: string }   - directly by coach ID
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const secret = authHeader?.replace('Bearer ', '')
    if (secret !== process.env.CRON_SECRET && secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const supabase = getAdminClient()

    // List mode: return all coaches, auth users, and unassigned client count
    if (body.list) {
      const { data: allCoaches } = await supabase.from('coaches').select('id, full_name, role')
      const { count } = await supabase.from('clients').select('id', { count: 'exact', head: true }).is('coach_id', null)
      const { count: totalClients } = await supabase.from('clients').select('id', { count: 'exact', head: true })
      // Try to list auth users
      let authUsers: { id: string; email: string }[] = []
      try {
        const { data } = await supabase.auth.admin.listUsers()
        authUsers = (data?.users ?? []).map(u => ({ id: u.id, email: u.email ?? '' }))
      } catch { /* ignore - may timeout */ }
      return NextResponse.json({ coaches: allCoaches, auth_users: authUsers, unassigned_clients: count, total_clients: totalClients })
    }

    // Setup mode: create coach records from auth users
    if (body.setup) {
      const entries = body.setup as { user_id: string; full_name: string; role: 'coach' | 'admin' }[]
      const results = []
      for (const entry of entries) {
        const { data, error } = await supabase
          .from('coaches')
          .upsert({ id: entry.user_id, full_name: entry.full_name, role: entry.role })
          .select()
          .single()
        results.push({ entry, data, error: error?.message })
      }
      return NextResponse.json({ results })
    }

    const coachName = body.coach_name as string | undefined
    const coachId = body.coach_id as string | undefined

    if (!coachName && !coachId) {
      return NextResponse.json({ error: 'coach_name or coach_id is required' }, { status: 400 })
    }

    // Find coach
    let coachQuery = supabase.from('coaches').select('id, full_name, role')
    if (coachId) {
      coachQuery = coachQuery.eq('id', coachId)
    } else {
      coachQuery = coachQuery.ilike('full_name', `%${coachName}%`)
    }

    const { data: coaches, error: coachError } = await coachQuery

    if (coachError || !coaches || coaches.length === 0) {
      return NextResponse.json({ error: `No coach found matching: ${coachName || coachId}` }, { status: 404 })
    }

    if (coaches.length > 1) {
      return NextResponse.json({
        error: 'Multiple coaches found, be more specific',
        matches: coaches.map(c => ({ id: c.id, full_name: c.full_name })),
      }, { status: 400 })
    }

    const coach = coaches[0]

    // Count clients with no coach assigned
    const { count: unassigned } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .is('coach_id', null)

    if (!unassigned || unassigned === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unassigned clients found',
        coach: { id: coach.id, full_name: coach.full_name },
        clients_assigned: 0,
      })
    }

    // Assign all unassigned clients to this coach
    const { error: updateError } = await supabase
      .from('clients')
      .update({ coach_id: coach.id })
      .is('coach_id', null)

    if (updateError) {
      log.error('Failed to assign clients', { error: updateError.message })
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Also update any calls without a coach_id
    await supabase
      .from('calls')
      .update({ coach_id: coach.id })
      .is('coach_id', null)

    log.info('Clients assigned to coach', {
      coachId: coach.id,
      coachName: coach.full_name,
      clientsAssigned: unassigned,
    })

    return NextResponse.json({
      success: true,
      coach: { id: coach.id, full_name: coach.full_name },
      clients_assigned: unassigned,
    })
  } catch (e) {
    log.error('Assign coach migration error', { error: (e as Error).message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
