import type { AdminClient } from '@/lib/supabase/admin'

/**
 * Download a photo from a temporary URL (e.g. Typeform) and upload it
 * to Supabase Storage for permanent access.
 *
 * Returns the public URL of the stored photo, or the original URL if
 * the transfer fails (so we never lose the reference).
 */
export async function persistPhoto(
  supabase: AdminClient,
  tempUrl: string,
  clientId: string,
  prefix: string = 'photo'
): Promise<string> {
  try {
    // Download the image from the temporary URL
    const response = await fetch(tempUrl)
    if (!response.ok) {
      console.error(`Failed to download photo: ${response.status} ${tempUrl}`)
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
      console.error('Failed to upload photo to storage:', uploadError.message)
      return tempUrl
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('client-photos')
      .getPublicUrl(path)

    return publicUrl
  } catch (err) {
    console.error('persistPhoto error:', err)
    return tempUrl // fallback to original URL
  }
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
