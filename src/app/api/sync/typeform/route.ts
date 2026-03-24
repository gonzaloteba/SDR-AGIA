import { NextRequest, NextResponse } from 'next/server'
import { runTypeformSync } from '@/lib/typeform-sync'

export async function POST(request: NextRequest) {
  try {
    // Auth check — only accept CRON_SECRET via Authorization header
    const authHeader = request.headers.get('authorization')
    const secret = authHeader?.replace('Bearer ', '')
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runTypeformSync()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', detail: (error as Error).message },
      { status: 500 }
    )
  }
}
