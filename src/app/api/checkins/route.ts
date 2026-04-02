import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { convertHeicBufferIfNeeded } from '@/lib/photo-storage'
import { logger } from '@/lib/logger'

const log = logger('api:checkins')

// POST /api/checkins — create a manual check-in with photos
// Body: multipart/form-data with "files" (File[]), "client_id" (string), "date" (string, ISO date)
export async function POST(request: NextRequest) {
  try {
    // Verify authenticated user
    const userSupabase = await createClient()
    const { data: { user } } = await userSupabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()

    const formData = await request.formData()
    const clientId = formData.get('client_id') as string
    const date = formData.get('date') as string
    const files = formData.getAll('files') as File[]

    if (!clientId) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }
    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 })
    }
    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 })
    }

    // Upload photos
    const uploadedUrls: string[] = []
    for (const file of files) {
      const rawBuffer = Buffer.from(await file.arrayBuffer())

      // Convert HEIC/HEIF to JPEG so browsers can display the photo
      const { buffer, contentType } = await convertHeicBufferIfNeeded(rawBuffer, file.type || 'image/jpeg')

      const ext = contentType.includes('png') ? 'png'
        : contentType.includes('webp') ? 'webp'
        : 'jpg'
      const timestamp = Date.now()
      const path = `clients/${clientId}/checkin-${timestamp}-${Math.random().toString(36).slice(2, 6)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(path, buffer, {
          contentType,
          upsert: false,
        })

      if (uploadError) {
        log.error('Photo upload failed', { error: uploadError.message, path })
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('client-photos')
        .getPublicUrl(path)

      uploadedUrls.push(publicUrl)
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ error: 'All uploads failed' }, { status: 500 })
    }

    // Create check-in with the given date
    const { data: checkIn, error: insertError } = await supabase
      .from('check_ins')
      .insert({
        client_id: clientId,
        submitted_at: new Date(date).toISOString(),
        photo_urls: uploadedUrls,
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, checkInId: checkIn.id, urls: uploadedUrls })
  } catch (e) {
    log.error('Manual check-in creation error', { error: (e as Error).message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
