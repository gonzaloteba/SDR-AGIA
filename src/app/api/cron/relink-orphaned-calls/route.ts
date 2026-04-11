import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { findClientByName, extractClientNameFromTranscript } from '@/lib/typeform-helpers'
import { generateCoachActions, generateTranscriptSummary, generatePositiveHighlights, ApiKeyMissingError, AnthropicApiError } from '@/lib/transcript-ai'
import { createAlertsFromCoachActions } from '@/lib/call-alerts'
import { logger } from '@/lib/logger'

export const maxDuration = 120

const log = logger('api:cron:relink-orphaned-calls')

/**
 * POST /api/cron/relink-orphaned-calls
 *
 * Finds calls with no client_id and tries to match them to clients
 * using the transcript content. Also generates missing AI content
 * (summary, highlights, coach actions) for newly linked calls.
 *
 * This fixes calls that were synced from Google Drive but couldn't
 * be matched to a client at the time of sync.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()

    // Find orphaned calls: have transcript but no client_id
    const { data: orphanedCalls, error: fetchError } = await supabase
      .from('calls')
      .select('id, transcript, call_date, transcript_summary, coach_actions, positive_highlights')
      .is('client_id', null)
      .not('transcript', 'is', null)
      .order('call_date', { ascending: false })

    if (fetchError) {
      log.error('Failed to fetch orphaned calls', { error: fetchError.message })
      return NextResponse.json(
        { error: 'Failed to fetch orphaned calls', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!orphanedCalls || orphanedCalls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orphaned calls found',
        relinked: 0,
        ai_generated: 0,
      })
    }

    log.info('Found orphaned calls', { count: orphanedCalls.length })

    // Pre-load all clients for efficient matching
    const { data: allClients, error: clientsError } = await supabase
      .from('clients')
      .select('id, first_name, last_name')

    if (clientsError || !allClients) {
      log.error('Failed to fetch clients', { error: clientsError?.message })
      return NextResponse.json(
        { error: 'Failed to fetch clients', details: clientsError?.message },
        { status: 500 }
      )
    }

    let relinked = 0
    let aiGenerated = 0
    const results: { callId: string; callDate: string; action: string; clientName?: string }[] = []

    for (const call of orphanedCalls) {
      // Extract client name from transcript content
      const extracted = extractClientNameFromTranscript(call.transcript)
      if (!extracted || !extracted.firstName) {
        results.push({ callId: call.id, callDate: call.call_date, action: 'no_name_extracted' })
        continue
      }

      // Try to match
      const client = await findClientByName(supabase, extracted.firstName, extracted.lastName)
      if (!client) {
        log.warn('No client match for orphaned call', {
          callId: call.id,
          extractedName: `${extracted.firstName} ${extracted.lastName}`,
        })
        results.push({
          callId: call.id,
          callDate: call.call_date,
          action: 'no_client_match',
          clientName: `${extracted.firstName} ${extracted.lastName}`,
        })
        continue
      }

      // Link the call to the client
      const updateData: Record<string, unknown> = { client_id: client.id }

      // Generate AI content if missing
      const needsAI = !call.transcript_summary || !call.coach_actions || !call.positive_highlights
      const clientName = `${extracted.firstName} ${extracted.lastName}`.trim()

      if (needsAI) {
        try {
          const [summary, actions, highlights] = await Promise.all([
            !call.transcript_summary ? generateTranscriptSummary(call.transcript, clientName) : null,
            !call.coach_actions ? generateCoachActions(call.transcript, clientName) : null,
            !call.positive_highlights ? generatePositiveHighlights(call.transcript, clientName) : null,
          ])

          if (summary) updateData.transcript_summary = summary
          if (actions) {
            updateData.coach_actions = actions
            updateData.coach_actions_completed = false
            updateData.coach_actions_completed_items = []
          }
          if (highlights) updateData.positive_highlights = highlights

          if (summary || actions || highlights) aiGenerated++
        } catch (error) {
          if (error instanceof ApiKeyMissingError) {
            log.warn('ANTHROPIC_API_KEY not configured — skipping AI generation')
          } else {
            const msg = error instanceof AnthropicApiError ? error.message : (error as Error).message
            log.warn('AI generation failed for orphaned call', { callId: call.id, error: msg })
          }
        }
      }

      const { error: updateError } = await supabase
        .from('calls')
        .update(updateData)
        .eq('id', call.id)

      if (updateError) {
        log.error('Failed to relink call', { callId: call.id, error: updateError.message })
        results.push({ callId: call.id, callDate: call.call_date, action: 'update_failed' })
        continue
      }

      // Resolve upcoming_call alerts for this client
      try {
        await supabase
          .from('alerts')
          .update({ is_resolved: true, resolved_at: new Date().toISOString() })
          .eq('client_id', client.id)
          .eq('type', 'upcoming_call')
          .eq('is_resolved', false)
      } catch {
        // Non-critical
      }

      // Create coach action alerts if actions were generated
      if (updateData.coach_actions) {
        await createAlertsFromCoachActions(
          supabase,
          client.id,
          call.id,
          updateData.coach_actions as string,
          clientName
        )
      }

      relinked++
      results.push({
        callId: call.id,
        callDate: call.call_date,
        action: 'relinked',
        clientName,
      })

      log.info('Relinked orphaned call', {
        callId: call.id,
        clientId: client.id,
        clientName,
      })
    }

    return NextResponse.json({
      success: true,
      total_orphaned: orphanedCalls.length,
      relinked,
      ai_generated: aiGenerated,
      results,
    })
  } catch (error) {
    log.error('Relink orphaned calls cron failed', { error: (error as Error).message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
