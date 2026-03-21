import sharp from 'sharp'
import type { AdminClient } from '@/lib/supabase/admin'

/** Content types that browsers cannot display natively and need conversion */
const NEEDS_CONVERSION = ['image/heic', 'image/heif']

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

      let buffer = Buffer.from(await response.arrayBuffer())
      let contentType = response.headers.get('content-type') || 'image/jpeg'

      // Convert HEIC/HEIF to JPEG (browsers cannot display these formats)
      if (NEEDS_CONVERSION.some((t) => contentType.includes(t))) {
        buffer = Buffer.from(await sharp(buffer).jpeg({ quality: 85 }).toBuffer())
        contentType = 'image/jpeg'
      }

      // Determine file extension from content type
      const ext = contentType.includes('png') ? 'png'
        : contentType.includes('webp') ? 'webp'
        : 'jpg'

      // Build a unique path: clients/<clientId>/<prefix>-<timestamp>.<ext>
      const timestamp = Date.now()
      const path = `clients/${clientId}/${prefix}-${timestamp}.${ext}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(path, buffer, {
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

/**
 * Re-download already-persisted photos from Supabase Storage, check if the
 * actual content is HEIC/HEIF, and if so convert to JPEG and re-upload.
 *
 * This fixes photos that were uploaded before HEIC conversion was added —
 * they have a .jpg extension but the binary content is actually HEIC.
 */
export async function reconvertHeicPhotos(
  supabase: AdminClient
): Promise<{ photosFixed: number; errors: string[] }> {
  const stats = { photosFixed: 0, errors: [] as string[] }

  async function reconvertUrl(url: string, clientId: string, prefix: string): Promise<string | null> {
    if (!url || !isPersistedUrl(url)) return null

    const response = await fetch(url)
    if (!response.ok) return null

    const buffer = Buffer.from(await response.arrayBuffer())

    // Check for HEIC magic bytes: offset 4-8 should be "ftyp" and offset 8-12
    // should start with "heic", "heix", "hevc", "mif1", etc.
    const hasFtyp = buffer.length > 12 &&
      buffer.toString('ascii', 4, 8) === 'ftyp'
    const brand = hasFtyp ? buffer.toString('ascii', 8, 12) : ''
    const isHeic = hasFtyp && ['heic', 'heix', 'hevc', 'hevx', 'mif1'].includes(brand)

    if (!isHeic) return null

    // Convert to JPEG
    const jpegBuffer = Buffer.from(await sharp(buffer).jpeg({ quality: 85 }).toBuffer())

    // Upload to new path
    const timestamp = Date.now()
    const path = `clients/${clientId}/${prefix}-${timestamp}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('client-photos')
      .upload(path, jpegBuffer, { contentType: 'image/jpeg', upsert: false })

    if (uploadError) return null

    const { data: { publicUrl } } = supabase.storage
      .from('client-photos')
      .getPublicUrl(path)

    return publicUrl
  }

  // Fix client initial_photo_url
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name, initial_photo_url')
    .not('initial_photo_url', 'is', null)

  for (const client of clients || []) {
    if (!client.initial_photo_url) continue
    try {
      const newUrl = await reconvertUrl(client.initial_photo_url, client.id, 'initial-fixed')
      if (newUrl) {
        await supabase.from('clients').update({ initial_photo_url: newUrl }).eq('id', client.id)
        stats.photosFixed++
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
    if (!urls) continue

    try {
      let anyFixed = false
      const newUrls = await Promise.all(
        urls.map(async (url, i) => {
          const newUrl = await reconvertUrl(url, ci.client_id, `checkin-fixed-${i}`)
          if (newUrl) { anyFixed = true; return newUrl }
          return url
        })
      )
      if (anyFixed) {
        await supabase.from('check_ins').update({ photo_urls: newUrls }).eq('id', ci.id)
        stats.photosFixed++
      }
    } catch (e) {
      stats.errors.push(`Check-in ${ci.id}: ${(e as Error).message}`)
    }
  }

  return stats
}
