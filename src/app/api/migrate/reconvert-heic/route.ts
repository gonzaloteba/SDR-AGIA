import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { reconvertHeicPhotos } from '@/lib/photo-storage'

// Allow up to 120s for HEIC conversion (pure JS decoder is slow)
export const maxDuration = 120

/**
 * POST /api/migrate/reconvert-heic
 *
 * One-off endpoint to find already-persisted photos that are actually HEIC
 * (uploaded before HEIC conversion was added) and convert them to JPEG.
 */
export async function POST(request: NextRequest) {
  try {
    // Block migrations in production unless explicitly allowed
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_MIGRATIONS) {
      return NextResponse.json({ error: 'Migrations disabled in production' }, { status: 403 })
    }

    const authHeader = request.headers.get('authorization')
    const secret = authHeader?.replace('Bearer ', '')
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()
    const results = await reconvertHeicPhotos(supabase)

    return NextResponse.json({ success: true, results })
  } catch (e) {
    const { logger } = await import('@/lib/logger')
    logger('api:migrate:reconvert-heic').error('Reconvert HEIC error', { error: (e as Error).message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
