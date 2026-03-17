import type { AdminClient } from '@/lib/supabase/admin'

/**
 * Build fetch headers for downloading a photo URL.
 * Typeform file URLs require Bearer token authentication.
 */
function buildPhotoFetchHeaders(url: string): Record<string, string> {
  const headers: Record<string, string> = {}
  const typeformToken = process.env.TYPEFORM_API_TOKEN
  if (typeformToken && url.includes('typeform')) {
    headers['Authorization'] = `Bearer ${typeformToken}`
  }
  return headers
}

/** Check whether a URL is already persisted in Supabase Storage */
export function isPersistedUrl(url: string): boolean {
  return url.includes('/storage/v1/object/public/client-photos/')
}

/**
 * Download a photo from a temporary URL (e.g. Typeform) and upload it
 * to Supabase Storage for permanent access.
 *
 * Retries up to 3 times on failure. Returns the public URL of the stored
 * photo, or the original URL if all attempts fail.
 */
export async function persistPhoto(
  supabase: AdminClient,
  tempUrl: string,
  clientId: string,
  prefix: string = 'photo'
): Promise<string> {
  // Already persisted — nothing to do
  if (isPersistedUrl(tempUrl)) return tempUrl

  const MAX_RETRIES = 3

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(tempUrl, {
        headers: buildPhotoFetchHeaders(tempUrl),
      })
      if (!response.ok) {
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, attempt * 1000))
          continue
        }
        return tempUrl
      }

      const blob = await response.blob()

      // Determine file extension from content type
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const ext = contentType.includes('png') ? 'png'
        : contentType.includes('webp') ? 'webp'
        : 'jpg'

      // Build a unique path: clients/<clientId>/<prefix>-<timestamp>.<ext>
      const timestamp = Date.now()
      const path = `clients/${clientId}/${prefix}-${timestamp}.${ext}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(path, blob, {
          contentType,
          upsert: false,
        })

      if (uploadError) {
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, attempt * 1000))
          continue
        }
        return tempUrl
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client-photos')
        .getPublicUrl(path)

      return publicUrl
    } catch {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, attempt * 1000))
        continue
      }
      return tempUrl
    }
  }

  return tempUrl
}

/**
 * Persist multiple photos and return the array of permanent URLs.
 */
export async function persistPhotos(
  supabase: AdminClient,
  urls: string[],
  clientId: string,
  prefix: string = 'checkin'
): Promise<string[]> {
  const results = await Promise.all(
    urls.map((url, i) => persistPhoto(supabase, url, clientId, `${prefix}-${i}`))
  )
  return results
}

/**
 * Scan the database for any photo URLs still pointing at Typeform
 * (temporary/expired) and re-persist them to Supabase Storage.
 *
 * This is designed to be called automatically from the sync endpoint
 * so broken photos get fixed without manual intervention.
 */
export async function fixBrokenPhotoUrls(
  supabase: AdminClient
): Promise<{ clientsFixed: number; checkInsFixed: number; errors: string[] }> {
  const stats = { clientsFixed: 0, checkInsFixed: 0, errors: [] as string[] }

  // Fix client initial_photo_url
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name, initial_photo_url')
    .not('initial_photo_url', 'is', null)

  for (const client of clients || []) {
    if (!client.initial_photo_url || isPersistedUrl(client.initial_photo_url)) continue

    try {
      const permanentUrl = await persistPhoto(supabase, client.initial_photo_url, client.id, 'initial')
      if (permanentUrl !== client.initial_photo_url) {
        await supabase.from('clients').update({ initial_photo_url: permanentUrl }).eq('id', client.id)
        stats.clientsFixed++
      }
    } catch (e) {
      stats.errors.push(`${client.first_name} ${client.last_name}: ${(e as Error).message}`)
    }
  }

  // Fix check-in photo_urls
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('id, client_id, photo_urls')
    .not('photo_urls', 'is', null)

  for (const ci of checkIns || []) {
    const urls = ci.photo_urls as string[] | null
    if (!urls || urls.every((u: string) => isPersistedUrl(u))) continue

    try {
      const permanentUrls = await persistPhotos(supabase, urls, ci.client_id, 'checkin')
      const anyFixed = permanentUrls.some((u: string, i: number) => u !== urls[i])
      if (anyFixed) {
        await supabase.from('check_ins').update({ photo_urls: permanentUrls }).eq('id', ci.id)
        stats.checkInsFixed++
      }
    } catch (e) {
      stats.errors.push(`Check-in ${ci.id}: ${(e as Error).message}`)
    }
  }

  return stats
}
