import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { persistPhoto, persistPhotos } from '@/lib/photo-storage'

/**
 * POST /api/migrate/fix-photos?secret=...
 *
 * Finds all photo URLs that still point to Typeform (temporary) and
 * re-downloads + uploads them to Supabase Storage for permanent access.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const authHeader = request.headers.get('authorization')
  const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '')

  if (secret !== process.env.CRON_SECRET && secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  const results = {
    clients_checked: 0,
    clients_fixed: 0,
    checkins_checked: 0,
    checkins_fixed: 0,
    errors: [] as string[],
  }

  // Fix client initial_photo_url
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name, initial_photo_url')
    .not('initial_photo_url', 'is', null)

  for (const client of clients || []) {
    results.clients_checked++
    if (!client.initial_photo_url || !client.initial_photo_url.includes('typeform')) continue

    try {
      const permanentUrl = await persistPhoto(supabase, client.initial_photo_url, client.id, 'initial')
      if (permanentUrl !== client.initial_photo_url) {
        await supabase
          .from('clients')
          .update({ initial_photo_url: permanentUrl })
          .eq('id', client.id)
        results.clients_fixed++
      } else {
        results.errors.push(`${client.first_name} ${client.last_name}: photo download failed (URL may be expired)`)
      }
    } catch (e) {
      results.errors.push(`${client.first_name} ${client.last_name}: ${(e as Error).message}`)
    }
  }

  // Fix check-in photo_urls
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('id, client_id, photo_urls')
    .not('photo_urls', 'is', null)

  for (const ci of checkIns || []) {
    results.checkins_checked++
    const urls = ci.photo_urls as string[] | null
    if (!urls || !urls.some((u: string) => u.includes('typeform'))) continue

    try {
      const permanentUrls = await persistPhotos(supabase, urls, ci.client_id, 'checkin')
      const anyFixed = permanentUrls.some((u: string, i: number) => u !== urls[i])
      if (anyFixed) {
        await supabase
          .from('check_ins')
          .update({ photo_urls: permanentUrls })
          .eq('id', ci.id)
        results.checkins_fixed++
      }
    } catch (e) {
      results.errors.push(`Check-in ${ci.id}: ${(e as Error).message}`)
    }
  }

  return NextResponse.json({ success: true, results })
}
