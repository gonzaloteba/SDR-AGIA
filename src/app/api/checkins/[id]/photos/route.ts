import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

const log = logger('api:checkin-photos')

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/checkins/[id]/photos — upload photos to a check-in
// Body: multipart/form-data with "files" (File[]) and optional "date" (string, ISO date for new check-in)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: checkInId } = await context.params

    // Verify authenticated user
    const userSupabase = await createClient()
    const { data: { user } } = await userSupabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()

    // Get check-in to verify it exists and get client_id
    const { data: checkIn, error: fetchError } = await supabase
      .from('check_ins')
      .select('id, client_id, photo_urls')
      .eq('id', checkInId)
      .single()

    if (fetchError || !checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = file.type.includes('png') ? 'png'
        : file.type.includes('webp') ? 'webp'
        : 'jpg'
      const timestamp = Date.now()
      const path = `clients/${checkIn.client_id}/checkin-${timestamp}-${Math.random().toString(36).slice(2, 6)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(path, buffer, {
          contentType: file.type || 'image/jpeg',
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

    // Append new URLs to existing photo_urls
    const existingUrls = (checkIn.photo_urls as string[]) || []
    const updatedUrls = [...existingUrls, ...uploadedUrls]

    const { error: updateError } = await supabase
      .from('check_ins')
      .update({ photo_urls: updatedUrls })
      .eq('id', checkInId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, urls: uploadedUrls })
  } catch (e) {
    log.error('Photo upload error', { error: (e as Error).message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/checkins/[id]/photos — remove a photo from a check-in
// Body: { url: string }
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: checkInId } = await context.params

    // Verify authenticated user
    const userSupabase = await createClient()
    const { data: { user } } = await userSupabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json() as { url: string }
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Get check-in
    const { data: checkIn, error: fetchError } = await supabase
      .from('check_ins')
      .select('id, photo_urls')
      .eq('id', checkInId)
      .single()

    if (fetchError || !checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    const existingUrls = (checkIn.photo_urls as string[]) || []
    const updatedUrls = existingUrls.filter((u) => u !== url)

    // Update database
    const { error: updateError } = await supabase
      .from('check_ins')
      .update({ photo_urls: updatedUrls })
      .eq('id', checkInId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Try to delete from storage (best effort)
    const match = url.match(/\/client-photos\/(.+)$/)
    if (match) {
      await supabase.storage.from('client-photos').remove([match[1]])
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    log.error('Photo delete error', { error: (e as Error).message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
