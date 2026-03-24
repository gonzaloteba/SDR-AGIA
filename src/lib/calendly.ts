import { logger } from '@/lib/logger'

const log = logger('calendly')

const CALENDLY_API_BASE = 'https://api.calendly.com'
const CALENDLY_TIMEOUT_MS = 15_000 // 15 second timeout

interface CalendlyEvent {
  uri: string
  name: string
  status: 'active' | 'canceled'
  start_time: string
  end_time: string
  event_type: string
  location?: {
    type: string
    join_url?: string
  }
}

interface CalendlyInvitee {
  uri: string
  name: string
  email: string
  status: 'active' | 'canceled'
}

interface CalendlyPaginated<T> {
  collection: T[]
  pagination: {
    count: number
    next_page: string | null
    next_page_token: string | null
  }
}

function getToken(): string {
  const token = process.env.CALENDLY_API_TOKEN
  if (!token) throw new Error('CALENDLY_API_TOKEN is not configured')
  return token
}

async function calendlyFetch<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${CALENDLY_API_BASE}${path}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CALENDLY_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text()
      log.error('Calendly API error', { status: res.status, path, body })
      throw new Error(`Calendly API ${res.status}: ${body}`)
    }

    return res.json() as Promise<T>
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      log.error('Calendly API timeout', { path, timeoutMs: CALENDLY_TIMEOUT_MS })
      throw new Error(`Calendly API timeout after ${CALENDLY_TIMEOUT_MS}ms: ${path}`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

/** Get the current user's URI */
export async function getCurrentUser(): Promise<{ uri: string; name: string; organization: string }> {
  const data = await calendlyFetch<{ resource: { uri: string; name: string; current_organization: string } }>('/users/me')
  return {
    uri: data.resource.uri,
    name: data.resource.name,
    organization: data.resource.current_organization,
  }
}

/** Fetch scheduled events for a user within a time range */
export async function getScheduledEvents(
  userUri: string,
  minStartTime: string,
  maxStartTime: string,
): Promise<CalendlyEvent[]> {
  const events: CalendlyEvent[] = []
  let pageToken: string | null = null

  do {
    const params = new URLSearchParams({
      user: userUri,
      min_start_time: minStartTime,
      max_start_time: maxStartTime,
      status: 'active',
      count: '100',
    })
    if (pageToken) params.set('page_token', pageToken)

    const data = await calendlyFetch<CalendlyPaginated<CalendlyEvent>>(
      `/scheduled_events?${params.toString()}`
    )
    events.push(...data.collection)
    pageToken = data.pagination.next_page_token
  } while (pageToken)

  log.info('Fetched scheduled events', { count: events.length })
  return events
}

/** Fetch invitees for a specific event */
export async function getEventInvitees(eventUri: string): Promise<CalendlyInvitee[]> {
  const data = await calendlyFetch<CalendlyPaginated<CalendlyInvitee>>(
    `${eventUri}/invitees`
  )
  return data.collection
}

/** Extract a Google Meet join URL from an event */
export function extractMeetLink(event: CalendlyEvent): string | null {
  if (event.location?.join_url) {
    return event.location.join_url
  }
  return null
}

export type { CalendlyEvent, CalendlyInvitee }
