import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = getAdminClient()

  // Check if column already exists
  const { error: checkError } = await supabase
    .from('clients')
    .select('onboarding_response_id')
    .limit(1)

  if (!checkError) {
    return NextResponse.json({ message: 'Column already exists, no migration needed' })
  }

  const sql = `
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_response_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_clients_onboarding_response_id ON clients (onboarding_response_id);
  `

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

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
}
