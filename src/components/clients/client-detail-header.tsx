import Link from 'next/link'
import { ArrowLeft, ExternalLink, Edit } from 'lucide-react'
import { getDaysRemaining } from '@/lib/health-score'
import { StatusDropdown } from '@/components/clients/status-dropdown'
import { PhaseDropdown } from '@/components/clients/phase-dropdown'
import type { Client, NutritionPhase } from '@/lib/types'

interface ClientDetailHeaderProps {
  client: Client
  alertCount: number
}

export function ClientDetailHeader({ client, alertCount }: ClientDetailHeaderProps) {
  const daysRemaining = getDaysRemaining(client.end_date)

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/clients"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {client.first_name} {client.last_name}
              </h1>
              <StatusDropdown
                clientId={client.id}
                currentStatus={client.status}
                size="md"
              />
              {alertCount > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  {alertCount} alerta{alertCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <PhaseDropdown
                clientId={client.id}
                currentPhase={client.current_phase as NutritionPhase}
              />
              <span>{daysRemaining} días restantes</span>
              <span>
                Inicio: {new Date(client.start_date).toLocaleDateString('es-ES')}
              </span>
              {client.timezone && <span>{client.timezone}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {client.drive_folder_url && (
            <a
              href={client.drive_folder_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <ExternalLink className="h-3 w-3" />
              Drive
            </a>
          )}
          <Link
            href={`/dashboard/clients/${client.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Edit className="h-3 w-3" />
            Editar
          </Link>
        </div>
      </div>

      {/* Contact info */}
      <div className="mt-4 flex gap-6 text-sm">
        {client.email && (
          <span className="text-muted-foreground">
            Email: <span className="text-foreground">{client.email}</span>
          </span>
        )}
        {client.phone && (
          <span className="text-muted-foreground">
            Tel: <span className="text-foreground">{client.phone}</span>
          </span>
        )}
        {client.closer && (
          <span className="text-muted-foreground">
            Closer: <span className="text-foreground">{client.closer}</span>
          </span>
        )}
        <span className="text-muted-foreground">
          Renovación: <span className="text-foreground">
            {new Date(client.renewal_date).toLocaleDateString('es-ES')}
          </span>
        </span>
      </div>
    </div>
  )
}
