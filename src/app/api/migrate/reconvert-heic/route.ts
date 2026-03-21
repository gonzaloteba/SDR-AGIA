import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { reconvertHeicPhotos } from '@/lib/photo-storage'

/**
 * POST /api/migrate/reconvert-heic
 *
 * One-off endpoint to find already-persisted photos that are actually HEIC
 * (uploaded before HEIC conversion was added) and convert them to JPEG.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const secret = authHeader?.replace('Bearer ', '')
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()
    const results = await reconvertHeicPhotos(supabase)

    return NextResponse.json({ success: true, results })
  } catch (e) {
    return NextResponse.json(
      { error: 'Internal server error', message: (e as Error).message },
      { status: 500 }
    )
  }
}
