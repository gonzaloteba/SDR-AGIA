import { Phone, Video, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ScheduledCall {
  id: string
  client_id: string
  call_date: string
  scheduled_at: string
  meet_link: string | null
  calendly_event_uri: string | null
  client: {
    first_name: string
    last_name: string
  }
}

interface UpcomingCallsProps {
  calls: ScheduledCall[]
}

export function UpcomingCalls({ calls }: UpcomingCallsProps) {
  if (calls.length === 0) return null

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-800">
        <Phone className="h-4 w-4" />
        Llamadas programadas ({calls.length})
      </h3>
      <div className="space-y-3">
        {calls.map((call) => {
          const scheduledDate = new Date(call.scheduled_at)
          const now = new Date()
          const diffMs = scheduledDate.getTime() - now.getTime()
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

          let urgencyLabel: string
          let urgencyClass: string
          if (diffMs < 0) {
            urgencyLabel = 'Ahora'
            urgencyClass = 'bg-red-100 text-red-800'
          } else if (diffHours < 2) {
            urgencyLabel = 'Inminente'
            urgencyClass = 'bg-red-100 text-red-800'
          } else if (diffHours < 24) {
            urgencyLabel = `En ${diffHours}h`
            urgencyClass = 'bg-orange-100 text-orange-800'
          } else {
            urgencyLabel = `En ${diffDays}d`
            urgencyClass = 'bg-blue-100 text-blue-800'
          }

          const formattedDate = scheduledDate.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })
          const formattedTime = scheduledDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <div
              key={call.id}
              className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${urgencyClass}`}>
                  {urgencyLabel}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/clients/${call.client_id}`}
                    className="text-sm font-medium hover:underline truncate block"
                  >
                    {call.client.first_name} {call.client.last_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formattedDate} a las {formattedTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {call.meet_link && (
                  <a
                    href={call.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    <Video className="h-3 w-3" />
                    Google Meet
                  </a>
                )}
                {!call.meet_link && call.calendly_event_uri && (
                  <a
                    href={call.calendly_event_uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Calendly
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
