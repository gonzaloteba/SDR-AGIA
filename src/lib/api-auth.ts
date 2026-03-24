import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify CRON_SECRET from Authorization header.
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export function requireCronAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization')
  const secret = authHeader?.replace('Bearer ', '')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * Escape special characters in a LIKE/ILIKE pattern to prevent injection.
 * Escapes %, _, and \ which have special meaning in SQL LIKE patterns.
 */
export function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&')
}
