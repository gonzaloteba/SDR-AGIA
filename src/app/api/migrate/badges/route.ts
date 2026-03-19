import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Auth check — only accept CRON_SECRET via Authorization header
    const authHeader = request.headers.get('authorization')
    const secret = authHeader?.replace('Bearer ', '')
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()

    // Check if columns already exist by attempting a select
    const { error: checkError } = await supabase
      .from('clients')
      .select('is_renewed')
      .limit(1)

    // If query succeeds (no error), columns exist
    if (!checkError) {
      return NextResponse.json({ message: 'Columns already exist, no migration needed' })
    }

    // Columns don't exist, run migration
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+)\.supabase\.co/)?.[1]

    if (!projectRef) {
      return NextResponse.json({ error: 'Could not determine project ref' }, { status: 500 })
    }

    const sql = `
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_renewed BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_success_case BOOLEAN NOT NULL DEFAULT false;
      UPDATE clients SET is_renewed = true, status = 'active' WHERE status = 'renewed';
      UPDATE clients SET is_success_case = true, status = 'active' WHERE status = 'success_case';
      ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;
      ALTER TABLE clients ADD CONSTRAINT clients_status_check CHECK (status IN ('active', 'cancelled', 'completed'));
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
    logger('api:migrate:badges').error('Badge migration error', { error: (e as Error).message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
