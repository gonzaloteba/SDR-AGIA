'use client'

import dynamic from 'next/dynamic'
import type { IntegrationStatus } from './actions'
import { FixOrphanCallsButton } from './fix-orphan-calls-button'

const TypeformSyncButton = dynamic(
  () => import('./typeform-sync-button').then(m => ({ default: m.TypeformSyncButton })),
  { ssr: false, loading: () => <div className="h-9 w-40 animate-pulse rounded-md bg-muted" /> }
)

const CalendlySyncButton = dynamic(
  () => import('./calendly-sync-button').then(m => ({ default: m.CalendlySyncButton })),
  { ssr: false, loading: () => <div className="h-9 w-40 animate-pulse rounded-md bg-muted" /> }
)

function StatusBadge({ configured, label }: { configured: boolean; label?: string }) {
  if (configured) {
    return (
      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        {label || 'Configurado'}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
      No configurado
    </span>
  )
}

interface Props {
  status: IntegrationStatus
}

export function IntegrationsSection({ status }: Props) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="font-medium mb-4">Integraciones</h3>
      <div className="space-y-4 text-sm">
        {/* Typeform */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">Typeform</p>
              <p className="text-muted-foreground">
                Webhook para recibir check-ins automáticamente
              </p>
            </div>
            <StatusBadge configured={status.typeform.configured} />
          </div>
          {status.typeform.error && (
            <p className="mb-2 text-xs text-red-600">{status.typeform.error}</p>
          )}
          <TypeformSyncButton />
        </div>

        {/* Calendly */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">Calendly</p>
              <p className="text-muted-foreground">
                Sincroniza llamadas programadas con el dashboard
              </p>
            </div>
            <StatusBadge
              configured={status.calendly.configured}
              label={status.calendly.accountName ? `${status.calendly.accountName}` : 'Configurado'}
            />
          </div>
          {status.calendly.accountName && (
            <p className="mb-2 text-xs text-muted-foreground">
              Cuenta conectada: <strong>{status.calendly.accountName}</strong>
            </p>
          )}
          {status.calendly.error && (
            <p className="mb-2 text-xs text-red-600">{status.calendly.error}</p>
          )}
          <div className="flex gap-2">
            <CalendlySyncButton />
          </div>
        </div>

        {/* TrainingPeaks */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">TrainingPeaks</p>
            <p className="text-muted-foreground">
              Gestión manual de planes de entrenamiento
            </p>
          </div>
          <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            Manual
          </span>
        </div>

        {/* Fix orphan calls and clients */}
        <div className="rounded-lg border border-dashed p-4">
          <div className="mb-3">
            <p className="font-medium">Reparar asignaciones</p>
            <p className="text-muted-foreground">
              Asigna tu cuenta como coach a las llamadas y clientes que no tienen coach asignado
            </p>
          </div>
          <FixOrphanCallsButton />
        </div>
      </div>
    </div>
  )
}
