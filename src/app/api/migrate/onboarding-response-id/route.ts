import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Block migrations in production unless explicitly allowed
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_MIGRATIONS) {
      return NextResponse.json({ error: 'Migrations disabled in production' }, { status: 403 })
    }

    // Auth check — only accept CRON_SECRET via Authorization header
    const authHeader = request.headers.get('authorization')
    const secret = authHeader?.replace('Bearer ', '')
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()

    // Check if column already exists
    const { error: checkError } = await supabase
      .from('clients')
      .select('onboarding_response_id')
      .limit(1)

    // If query succeeds (no error), column exists
    if (!checkError) {
      return NextResponse.json({ message: 'Column already exists, no migration needed' })
    }

    const sql = `
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_response_id TEXT;
      CREATE INDEX IF NOT EXISTS idx_clients_onboarding_response_id ON clients (onboarding_response_id);
    `

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey || !baseUrl) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 })
    }

    const pgRes = await fetch(`${baseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ query: sql }),
    })

    if (pgRes.ok) {
      return NextResponse.json({ success: true, method: 'pg-meta' })
    }

    return NextResponse.json({
      error: 'Auto-migration failed. Please run this SQL in your Supabase SQL Editor:',
      sql,
    }, { status: 500 })
  } catch (e) {
    const { logger } = await import('@/lib/logger')
    logger('api:migrate:onboarding').error('Onboarding migration error', { error: (e as Error).message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
