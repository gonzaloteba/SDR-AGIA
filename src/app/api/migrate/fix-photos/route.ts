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
    const { searchParams } = new URL(request.url)
    const authHeader = request.headers.get('authorization')
    const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '')

    if (secret !== process.env.CRON_SECRET && secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()
    const results = await fixBrokenPhotoUrls(supabase)

    return NextResponse.json({ success: true, results })
  } catch (e) {
    console.error('Fix photos error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
