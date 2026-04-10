import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getDefaultCoachId } from '@/lib/auth'
import { findClientByName } from '@/lib/typeform-helpers'
import { generateCoachActions, generateTranscriptSummary, generatePositiveHighlights, ApiKeyMissingError } from '@/lib/transcript-ai'
import { logger } from '@/lib/logger'

// Allow up to 60s for AI generation + DB operations
export const maxDuration = 60

const log = logger('api:webhooks:google-transcript')

/**
 * Safely run all three AI generation functions.
 * Returns the results + whether AI was skipped due to missing config.
 * Never throws — if the API key is missing or AI fails, the call is still saved.
 */
async function safeGenerateAI(transcript: string, clientName?: string) {
  try {
    const [actions, summary, highlights] = await Promise.all([
      generateCoachActions(transcript, clientName),
      generateTranscriptSummary(transcript, clientName),
      generatePositiveHighlights(transcript, clientName),
    ])
    return { actions, summary, highlights, apiKeyMissing: false }
  } catch (error) {
    if (error instanceof ApiKeyMissingError) {
      log.warn('ANTHROPIC_API_KEY not configured — transcript saved without AI summary. Add it in Vercel → Settings → Environment Variables.')
      return { actions: null, summary: null, highlights: null, apiKeyMissing: true }
    }
    log.error('Unexpected error during AI generation', { error: (error as Error).message })
    return { actions: null, summary: null, highlights: null, apiKeyMissing: false }
  }
}

/**
 * POST /api/webhooks/google-transcript
 *
 * Receives call transcripts from a Google App Script that uses Gemini
 * to transcribe Google Meet recordings.
 *
 * Auth: Bearer token via GOOGLE_SCRIPT_SECRET env var.
 *
 * Body (JSON):
 *   - google_event_id: string (required) — Google Calendar event ID for dedup
 *   - meet_link: string (optional) — Google Meet URL
 *   - transcript: string (required) — Full transcript text
 *   - call_date: string (optional) — ISO date (YYYY-MM-DD), defaults to today
 *   - duration_minutes: number (optional) — Call duration, defaults to 15
 *   - client_first_name: string (optional) — To auto-match client (can contain full name)
 *   - client_last_name: string (optional) — To auto-match client
 *   - client_name: string (optional) — Full name alternative to first/last split
 *   - client_id: string (optional) — Direct client UUID if known
 *   - notes: string (optional) — Additional notes
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate with bearer token
    const secret = process.env.GOOGLE_SCRIPT_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: 'GOOGLE_SCRIPT_SECRET not configured' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const { google_event_id, transcript } = body
    if (!google_event_id || typeof google_event_id !== 'string') {
      return NextResponse.json(
        { error: 'google_event_id is required' },
        { status: 400 }
      )
    }
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'transcript is required' },
        { status: 400 }
      )
    }
    if (transcript.length > 50000) {
      return NextResponse.json(
        { error: 'transcript exceeds 50KB limit' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Check for existing call with this google_event_id (dedup)
    const { data: existingCall } = await supabase
      .from('calls')
      .select('id')
      .eq('google_event_id', google_event_id)
      .limit(1)
      .single()

    if (existingCall) {
      // Generate AI content from updated transcript
      const clientNameForUpdate = body.client_first_name
        ? `${body.client_first_name} ${body.client_last_name || ''}`.trim()
        : undefined
      const ai = await safeGenerateAI(transcript, clientNameForUpdate)

      // Update transcript on existing call
      const updatePayload: Record<string, unknown> = {
        transcript,
        ...(body.meet_link ? { meet_link: body.meet_link } : {}),
        ...(body.notes ? { notes: body.notes } : {}),
        ...(ai.actions ? { coach_actions: ai.actions, coach_actions_completed: false, coach_actions_completed_items: [] } : {}),
        ...(ai.summary ? { transcript_summary: ai.summary } : {}),
        ...(ai.highlights ? { positive_highlights: ai.highlights } : {}),
      }

      let updateError = (await supabase
        .from('calls')
        .update(updatePayload)
        .eq('id', existingCall.id)
      ).error

      // Retry once on failure
      if (updateError) {
        log.warn('Update failed, retrying', {
          callId: existingCall.id,
          error: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
        })
        updateError = (await supabase
          .from('calls')
          .update(updatePayload)
          .eq('id', existingCall.id)
        ).error
      }

      if (updateError) {
        log.error('Failed to update call after retry', {
          callId: existingCall.id,
          error: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
        })
        return NextResponse.json(
          { error: 'Failed to update call', details: updateError.message, code: updateError.code },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        action: 'transcript_updated',
        call_id: existingCall.id,
        summary_generated: !!ai.summary,
        highlights_generated: !!ai.highlights,
        coach_actions_generated: !!ai.actions,
        ...(ai.apiKeyMissing ? { warning: 'ANTHROPIC_API_KEY not configured — AI content will be generated by cron job once configured' } : {}),
      })
    }

    // No existing call with this google_event_id — resolve client first
    let clientId: string | null = body.client_id || null

    if (!clientId) {
      let firstName = (body.client_first_name || '').trim()
      let lastName = (body.client_last_name || '').trim()

      if (!firstName && !lastName && body.client_name) {
        const parts = body.client_name.trim().split(/\s+/)
        firstName = parts[0] || ''
        lastName = parts.slice(1).join(' ') || ''
      }

      if (firstName && !lastName && firstName.includes(' ')) {
        const parts = firstName.split(/\s+/)
        firstName = parts[0]
        lastName = parts.slice(1).join(' ')
      }

      if (firstName) {
        const client = await findClientByName(
          supabase,
          firstName,
          lastName
        )
        if (client) clientId = client.id
      }
    }

    const coachId = await getDefaultCoachId()
    const callDate = body.call_date || new Date().toISOString().split('T')[0]
    const durationMinutes = typeof body.duration_minutes === 'number'
      ? body.duration_minutes
      : 15

    // Check if there's a pre-scheduled call for this client on the same date
    let scheduledCall: { id: string; client_id: string | null } | null = null
    if (clientId) {
      const { data } = await supabase
        .from('calls')
        .select('id, client_id')
        .eq('client_id', clientId)
        .eq('call_date', callDate)
        .not('scheduled_at', 'is', null)
        .is('transcript', null)
        .limit(1)
        .single()
      scheduledCall = data
    }

    // Fallback 1: match by Google Meet link
    if (!scheduledCall && body.meet_link) {
      const { data } = await supabase
        .from('calls')
        .select('id, client_id')
        .eq('meet_link', body.meet_link)
        .eq('call_date', callDate)
        .is('transcript', null)
        .limit(1)
        .single()
      if (data) {
        scheduledCall = data
        if (!clientId && data.client_id) clientId = data.client_id
      }
    }

    // Fallback 2: single unmatched scheduled call for this date
    if (!scheduledCall) {
      const { data: dateMatches } = await supabase
        .from('calls')
        .select('id, client_id')
        .eq('call_date', callDate)
        .not('scheduled_at', 'is', null)
        .is('transcript', null)
      if (dateMatches && dateMatches.length === 1) {
        scheduledCall = dateMatches[0]
        if (!clientId && dateMatches[0].client_id) clientId = dateMatches[0].client_id
      }
    }

    // Generate AI content
    const clientName = body.client_first_name
      ? `${body.client_first_name} ${body.client_last_name || ''}`.trim()
      : undefined
    const ai = await safeGenerateAI(transcript, clientName)

    if (scheduledCall) {
      // Update the pre-scheduled call with transcript + AI data
      const updateData: Record<string, unknown> = {
        google_event_id,
        transcript,
        duration_minutes: durationMinutes,
      }
      if (body.meet_link) updateData.meet_link = body.meet_link
      if (body.notes) updateData.notes = body.notes
      if (ai.summary) updateData.transcript_summary = ai.summary
      if (ai.highlights) updateData.positive_highlights = ai.highlights
      if (ai.actions) {
        updateData.coach_actions = ai.actions
        updateData.coach_actions_completed = false
        updateData.coach_actions_completed_items = []
      }

      const { error: updateError } = await supabase
        .from('calls')
        .update(updateData)
        .eq('id', scheduledCall.id)

      if (updateError) {
        log.error('Failed to update scheduled call', {
          callId: scheduledCall.id,
          error: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
        })
        return NextResponse.json(
          { error: 'Failed to update scheduled call', details: updateError.message, code: updateError.code },
          { status: 500 }
        )
      }

      // Resolve upcoming_call alerts for this client
      if (clientId) {
        try {
          await supabase
            .from('alerts')
            .update({ is_resolved: true, resolved_at: new Date().toISOString() })
            .eq('client_id', clientId)
            .eq('type', 'upcoming_call')
            .eq('is_resolved', false)
        } catch (e) {
          console.warn('Alert resolution failed (non-critical):', (e as Error).message)
        }
      }

      return NextResponse.json({
        success: true,
        action: 'scheduled_call_completed',
        call_id: scheduledCall.id,
        client_id: clientId,
        summary_generated: !!ai.summary,
        highlights_generated: !!ai.highlights,
        coach_actions_generated: !!ai.actions,
        ...(ai.apiKeyMissing ? { warning: 'ANTHROPIC_API_KEY not configured — AI content will be generated by cron job once configured' } : {}),
      })
    }

    // No scheduled call found — create a new one with transcript + AI data
    const insertData: Record<string, unknown> = {
      google_event_id,
      transcript,
      call_date: callDate,
      duration_minutes: durationMinutes,
      coach_id: coachId,
    }
    if (clientId) insertData.client_id = clientId
    if (body.meet_link) insertData.meet_link = body.meet_link
    if (body.notes) insertData.notes = body.notes
    if (ai.summary) insertData.transcript_summary = ai.summary
    if (ai.highlights) insertData.positive_highlights = ai.highlights
    if (ai.actions) {
      insertData.coach_actions = ai.actions
      insertData.coach_actions_completed = false
      insertData.coach_actions_completed_items = []
    }

    const { data: newCall, error: insertError } = await supabase
      .from('calls')
      .insert(insertData)
      .select('id')
      .single()

    if (insertError) {
      log.error('Failed to create call', {
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      })
      return NextResponse.json(
        { error: 'Failed to create call', details: insertError.message, code: insertError.code },
        { status: 500 }
      )
    }

    // Resolve upcoming_call alerts if client matched
    if (clientId) {
      try {
        await supabase
          .from('alerts')
          .update({ is_resolved: true, resolved_at: new Date().toISOString() })
          .eq('client_id', clientId)
          .eq('type', 'upcoming_call')
          .eq('is_resolved', false)
      } catch (e) {
        console.warn('Alert resolution failed (non-critical):', (e as Error).message)
      }
    }

    return NextResponse.json({
      success: true,
      action: clientId ? 'call_created' : 'call_created_no_client',
      call_id: newCall.id,
      client_id: clientId,
      summary_generated: !!ai.summary,
      highlights_generated: !!ai.highlights,
      coach_actions_generated: !!ai.actions,
      ...(ai.apiKeyMissing ? { warning: 'ANTHROPIC_API_KEY not configured — AI content will be generated by cron job once configured' } : {}),
    })
  } catch (error) {
    log.error('Google transcript webhook failed', { error: (error as Error).message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
