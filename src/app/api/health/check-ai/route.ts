import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

/**
 * GET /api/health/check-ai
 *
 * Diagnostic endpoint: checks if ANTHROPIC_API_KEY is configured and working.
 * Makes a minimal API call to verify the key is valid and has credits.
 */
export async function GET() {
  const result: Record<string, string> = {
    timestamp: new Date().toISOString(),
  }

  // Step 1: Check if env var exists
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      ...result,
      status: 'ERROR',
      error: 'ANTHROPIC_API_KEY is NOT SET in environment variables',
      fix: 'Go to Vercel → Settings → Environment Variables → Add ANTHROPIC_API_KEY',
    }, { status: 500 })
  }

  result.key_prefix = apiKey.substring(0, 12) + '...'
  result.key_length = String(apiKey.length)

  // Step 2: Try a minimal API call
  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say OK' }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''

    return NextResponse.json({
      ...result,
      status: 'OK',
      model: message.model,
      response: text,
      message: 'Anthropic API is working correctly',
    })
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({
        ...result,
        status: 'ERROR',
        http_status: String(error.status),
        error: error.message,
        fix: error.status === 401
          ? 'API key is INVALID or EXPIRED. Create a new one at console.anthropic.com/settings/keys'
          : error.status === 429
            ? 'Rate limited. Wait a few minutes.'
            : error.message.includes('credit') || error.message.includes('billing')
              ? 'No credits. Add billing at console.anthropic.com/settings/billing'
              : `Anthropic API error: ${error.message}`,
      }, { status: 500 })
    }

    return NextResponse.json({
      ...result,
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
