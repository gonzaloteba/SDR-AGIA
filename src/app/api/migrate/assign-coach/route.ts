import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const log = logger('api:migrate:assign-coach')

// POST /api/migrate/assign-coach
// Multi-purpose endpoint for coach setup and client assignment.
//
// Modes:
// { "list": true }  - List coaches, auth users, and client counts
// { "create_coach": { "email": "...", "password": "...", "full_name": "...", "role": "coach"|"admin" } }
//   - Creates auth user + coach record in one step
// { "coach_name": "..." } or { "coach_id": "..." }
//   - Assigns all unassigned clients to matching coach
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const secret = authHeader?.replace('Bearer ', '')
    if (secret !== process.env.CRON_SECRET && secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const supabase = getAdminClient()

    // List mode
    if (body.list) {
      const { data: allCoaches } = await supabase.from('coaches').select('id, full_name, role')
      const { count } = await supabase.from('clients').select('id', { count: 'exact', head: true }).is('coach_id', null)
      const { count: totalClients } = await supabase.from('clients').select('id', { count: 'exact', head: true })
      let authUsers: { id: string; email: string }[] = []
      try {
        const { data } = await supabase.auth.admin.listUsers()
        authUsers = (data?.users ?? []).map(u => ({ id: u.id, email: u.email ?? '' }))
      } catch { /* ignore - may timeout */ }
      return NextResponse.json({ coaches: allCoaches, auth_users: authUsers, unassigned_clients: count, total_clients: totalClients })
    }

    // Create coach mode: creates auth user + coach record in one step
    if (body.create_coach) {
      const { email, password, full_name, role } = body.create_coach as {
        email: string; password: string; full_name: string; role: 'coach' | 'admin'
      }

      if (!email || !password || !full_name || !role) {
        return NextResponse.json({ error: 'create_coach requires email, password, full_name, role' }, { status: 400 })
      }

      // Check if auth user already exists by trying to find them
      let userId: string | null = null

      // Try creating auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (createError) {
        // User might already exist - try to find them
        if (createError.message.includes('already') || createError.message.includes('exists')) {
          try {
            const { data: users } = await supabase.auth.admin.listUsers()
            const existing = users?.users?.find(u => u.email === email)
            if (existing) userId = existing.id
          } catch {
            return NextResponse.json({
              error: `Auth user creation failed and could not look up existing: ${createError.message}`,
            }, { status: 500 })
          }
        }
        if (!userId) {
          return NextResponse.json({ error: `Failed to create auth user: ${createError.message}` }, { status: 500 })
        }
      } else {
        userId = newUser.user.id
      }

      // Create coach record
      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .upsert({ id: userId, full_name, role })
        .select()
        .single()

      if (coachError) {
        return NextResponse.json({ error: `Failed to create coach record: ${coachError.message}` }, { status: 500 })
      }

      log.info('Coach created', { id: userId, full_name, role, email })

      return NextResponse.json({
        success: true,
        coach,
        auth_user_id: userId,
      })
    }

    // Legacy setup mode
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

    // Assign clients mode
    const coachName = body.coach_name as string | undefined
    const coachId = body.coach_id as string | undefined

    if (!coachName && !coachId) {
      return NextResponse.json({ error: 'coach_name or coach_id is required' }, { status: 400 })
    }

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

    const { error: updateError } = await supabase
      .from('clients')
      .update({ coach_id: coach.id })
      .is('coach_id', null)

    if (updateError) {
      log.error('Failed to assign clients', { error: updateError.message })
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

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
