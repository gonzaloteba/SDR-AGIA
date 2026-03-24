import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { fixBrokenPhotoUrls } from '@/lib/photo-storage'

/**
 * POST /api/migrate/fix-photos?secret=...
 *
 * One-off endpoint to fix broken Typeform photo URLs.
 * NOTE: This also runs automatically on every /api/sync/typeform call.
 */
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
    const results = await fixBrokenPhotoUrls(supabase)

    return NextResponse.json({ success: true, results })
  } catch (e) {
    const { logger } = await import('@/lib/logger')
    logger('api:migrate:fix-photos').error('Fix photos error', { error: (e as Error).message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
