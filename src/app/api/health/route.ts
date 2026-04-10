import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const checks: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  }

  // Verify database connectivity
  try {
    const supabase = getAdminClient()
    const { error } = await supabase.from('coaches').select('id').limit(1)
    checks.database = error ? `error: ${error.message}` : 'connected'
    if (error) checks.status = 'degraded'
  } catch {
    checks.database = 'unreachable'
    checks.status = 'degraded'
  }

  const statusCode = checks.status === 'ok' ? 200 : 503
  return NextResponse.json(checks, { status: statusCode })
}
