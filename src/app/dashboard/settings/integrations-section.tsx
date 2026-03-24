'use client'

import dynamic from 'next/dynamic'

const TypeformSyncButton = dynamic(
  () => import('./typeform-sync-button').then(m => ({ default: m.TypeformSyncButton })),
  { ssr: false, loading: () => <div className="h-9 w-40 animate-pulse rounded-md bg-muted" /> }
)

const CalendlySyncButton = dynamic(
  () => import('./calendly-sync-button').then(m => ({ default: m.CalendlySyncButton })),
  { ssr: false, loading: () => <div className="h-9 w-40 animate-pulse rounded-md bg-muted" /> }
)

export function IntegrationsSection() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="font-medium mb-4">Integraciones</h3>
      <div className="space-y-4 text-sm">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">Typeform</p>
              <p className="text-muted-foreground">
                Webhook para recibir check-ins automáticamente
              </p>
            </div>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Configurado
            </span>
          </div>
          <TypeformSyncButton />
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">Calendly</p>
              <p className="text-muted-foreground">
                Sincroniza llamadas programadas con el dashboard
              </p>
            </div>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Configurado
            </span>
          </div>
          <CalendlySyncButton />
        </div>
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
      </div>
    </div>
  )
}
